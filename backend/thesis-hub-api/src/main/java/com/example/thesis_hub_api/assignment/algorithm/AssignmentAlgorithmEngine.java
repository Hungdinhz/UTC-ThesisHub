package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.entity.Preference;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.assignment.repository.PreferenceRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AssignmentAlgorithmEngine {

    private final PreferenceRepository preferenceRepository;
    private final LecturerCapacityRepository capacityRepository;
    private final SupervisorAssignmentRepository assignmentRepository;

    private final HardConstraintRule hardConstraintRule;
    private final SoftConstraintScorer softConstraintScorer;

    // Helper class for lecturer's accepted students
    private static class TentativeAssignment {
        Integer studentId;
        Integer lecturerId;
        Integer projectDirectionId;
        Integer preferenceOrder;
        Integer score;

        public TentativeAssignment(Integer studentId, Integer lecturerId, Integer projectDirectionId, Integer preferenceOrder, Integer score) {
            this.studentId = studentId;
            this.lecturerId = lecturerId;
            this.projectDirectionId = projectDirectionId;
            this.preferenceOrder = preferenceOrder;
            this.score = score;
        }
    }

    /**
     * Executes the Gale-Shapley assignment matching algorithm.
     * @param projectRoundId The ID of the project round.
     * @return List of generated proposals.
     */
    @Transactional
    public List<SupervisorAssignment> generateProposals(Integer projectRoundId) {
        log.info("Starting assignment algorithm for project round: {}", projectRoundId);

        // 1. Fetch preferences for the project round
        List<Preference> allPreferences = preferenceRepository.findByDirectionRegistrationProjectRoundId(projectRoundId);
        
        // Group preferences by student ID and sort by priority order
        Map<Integer, List<Preference>> studentPreferences = allPreferences.stream()
                .collect(Collectors.groupingBy(
                        pref -> pref.getDirectionRegistration().getStudentId(),
                        Collectors.collectingAndThen(Collectors.toList(), list -> {
                            list.sort(Comparator.comparingInt(Preference::getPriorityOrder));
                            return list;
                        })
                ));

        // 2. Fetch capacities for the project round
        List<LecturerCapacity> capacities = capacityRepository.findByProjectRoundId(projectRoundId);
        Map<Integer, LecturerCapacity> lecturerCapacities = capacities.stream()
                .collect(Collectors.toMap(LecturerCapacity::getLecturerId, cap -> cap));

        // State for Gale-Shapley
        Queue<Integer> freeStudents = new LinkedList<>(studentPreferences.keySet());
        Map<Integer, Integer> nextPreferenceIndex = new HashMap<>(); // studentId -> index of next preference
        for (Integer studentId : studentPreferences.keySet()) {
            nextPreferenceIndex.put(studentId, 0);
        }

        // State for Lecturer's accepted students: lecturerId -> PriorityQueue of TentativeAssignment (min-heap by score to easily evict lowest)
        Map<Integer, PriorityQueue<TentativeAssignment>> lecturerAssignments = new HashMap<>();
        for (LecturerCapacity cap : capacities) {
            // Min-heap: lowest score at the top
            lecturerAssignments.put(cap.getLecturerId(), new PriorityQueue<>(
                    Comparator.comparingInt(a -> a.score)
            ));
        }

        // 3. Perform Matching (Gale-Shapley with Capacities)
        while (!freeStudents.isEmpty()) {
            Integer studentId = freeStudents.poll();
            List<Preference> prefs = studentPreferences.get(studentId);
            int prefIndex = nextPreferenceIndex.get(studentId);

            if (prefIndex >= prefs.size()) {
                // Student has exhausted all preferences
                continue;
            }

            Preference currentPref = prefs.get(prefIndex);
            nextPreferenceIndex.put(studentId, prefIndex + 1); // increment for next time if rejected

            Integer lecturerId = currentPref.getLecturerId();
            LecturerCapacity capacity = lecturerCapacities.get(lecturerId);

            if (capacity == null) {
                // Lecturer has no capacity configured, reject
                freeStudents.add(studentId);
                continue;
            }

            // Check Hard Constraints
            // For simplicity, we assume isLecturerInDirection is true if the student could select them
            boolean isLecturerInDirection = true; 
            if (!hardConstraintRule.isValid(currentPref, capacity, isLecturerInDirection)) {
                // Hard constraint failed, reject
                freeStudents.add(studentId);
                continue;
            }

            // Calculate Score (Soft Constraints)
            int score = softConstraintScorer.calculateScore(currentPref);
            TentativeAssignment newAssignment = new TentativeAssignment(
                    studentId, 
                    lecturerId, 
                    currentPref.getDirectionRegistration().getProjectDirection().getId(),
                    currentPref.getPriorityOrder(), 
                    score
            );

            PriorityQueue<TentativeAssignment> acceptedStudents = lecturerAssignments.get(lecturerId);

            if (acceptedStudents.size() < capacity.getEffectiveCapacity()) {
                // Lecturer has space, accept tentatively
                acceptedStudents.add(newAssignment);
            } else {
                // Lecturer is full, check if new student is better than the worst accepted student
                if (!acceptedStudents.isEmpty()) {
                    TentativeAssignment worstAccepted = acceptedStudents.peek();
                    if (score > worstAccepted.score) {
                        // Accept new student, reject worst
                        acceptedStudents.poll(); // remove worst
                        freeStudents.add(worstAccepted.studentId); // worst student becomes free
                        acceptedStudents.add(newAssignment); // accept new
                    } else {
                        // Reject new student
                        freeStudents.add(studentId);
                    }
                } else {
                     // Capacity is 0, reject
                     freeStudents.add(studentId);
                }
            }
        }

        // 4. Clear old PROPOSED assignments for this round
        List<SupervisorAssignment> oldAssignments = assignmentRepository.findByProjectRoundId(projectRoundId);
        assignmentRepository.deleteAll(oldAssignments.stream().filter(a -> "PROPOSED".equals(a.getStatus())).collect(Collectors.toList()));

        // 5. Save proposals as PROPOSED in supervisor_assignments table
        List<SupervisorAssignment> newProposals = new ArrayList<>();
        for (PriorityQueue<TentativeAssignment> queue : lecturerAssignments.values()) {
            for (TentativeAssignment ta : queue) {
                SupervisorAssignment assignment = SupervisorAssignment.builder()
                        .studentId(ta.studentId)
                        .lecturerId(ta.lecturerId)
                        .projectRoundId(projectRoundId)
                        .projectDirectionId(ta.projectDirectionId)
                        .status("PROPOSED")
                        .preferenceOrder(ta.preferenceOrder)
                        .score(ta.score)
                        .reason("Assigned via Gale-Shapley Algorithm based on score.")
                        .build();
                newProposals.add(assignment);
            }
        }

        assignmentRepository.saveAll(newProposals);
        
        log.info("Generated {} assignment proposals for project round {}", newProposals.size(), projectRoundId);
        return newProposals;
    }
}
