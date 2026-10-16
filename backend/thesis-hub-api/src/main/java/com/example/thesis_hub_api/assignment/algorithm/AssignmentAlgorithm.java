package com.example.thesis_hub_api.assignment.algorithm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Core Supervisor Allocation Algorithm (Module Assignment).
 * Implements:
 * - Hard Constraints validation (Capacity limits, Degree requirement for KY_SU, Direction matching)
 * - Soft Constraints & Prioritization (NV1 -> NV2 -> NV3, GPA tie-breaking)
 * - Load balancing across faculty members
 * - Fallback allocation for students not matched in top 3 preferences
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AssignmentAlgorithm {

    private final AssignmentConstraints constraints;

    public List<AssignmentMatchResult> executeMatching(
            List<StudentAssignmentInput> students,
            List<LecturerAssignmentInput> lecturers) {

        log.info("Starting supervisor allocation algorithm for {} students and {} lecturers",
                students.size(), lecturers.size());

        Map<Long, LecturerAssignmentInput> lecturerMap = lecturers.stream()
                .collect(Collectors.toMap(LecturerAssignmentInput::getLecturerId, l -> l));

        Map<Long, AssignmentMatchResult> assignments = new HashMap<>();
        Set<Long> unassignedStudentIds = students.stream()
                .map(StudentAssignmentInput::getStudentId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        // Sort students by GPA descending for fair priority resolution
        List<StudentAssignmentInput> sortedStudents = new ArrayList<>(students);
        sortedStudents.sort((s1, s2) -> {
            double g1 = s1.getGpa() != null ? s1.getGpa() : 0.0;
            double g2 = s2.getGpa() != null ? s2.getGpa() : 0.0;
            return Double.compare(g2, g1);
        });

        // ==========================================
        // Phase 1: Sequential Preference Matching (NV1 -> NV2 -> NV3)
        // ==========================================
        for (int priority = 1; priority <= 3; priority++) {
            final int currentPriority = priority;
            log.info("Processing preference round NV{}", currentPriority);

            // Group candidate applications for this priority round by lecturer
            Map<Long, List<StudentAssignmentInput>> lecturerApplicants = new LinkedHashMap<>();

            for (StudentAssignmentInput student : sortedStudents) {
                if (!unassignedStudentIds.contains(student.getStudentId())) {
                    continue;
                }

                // Find preference for current priority
                Optional<StudentAssignmentInput.PreferenceEntry> prefOpt = student.getPreferences().stream()
                        .filter(p -> p.getPriority() == currentPriority)
                        .findFirst();

                if (prefOpt.isEmpty()) {
                    continue;
                }

                Long lecturerId = prefOpt.get().getLecturerId();
                LecturerAssignmentInput lecturer = lecturerMap.get(lecturerId);
                if (lecturer == null) {
                    continue;
                }

                // Check Hard Constraint: Degree requirement
                if (!constraints.checkDegreeConstraint(student.getTrainingProgramCode(), lecturer.getAcademicDegree())) {
                    log.warn("Student {} (KY_SU) skipped NV{} lecturer {} due to degree constraint ({})",
                            student.getStudentId(), currentPriority, lecturer.getLecturerId(), lecturer.getAcademicDegree());
                    continue;
                }

                // Check Hard Constraint: Direction match
                if (!constraints.checkDirectionConstraint(student.getDirectionId(), lecturer.getDirectionIds())) {
                    log.warn("Student {} skipped NV{} lecturer {} because lecturer is not in direction {}",
                            student.getStudentId(), currentPriority, lecturer.getLecturerId(), student.getDirectionId());
                    continue;
                }

                lecturerApplicants.computeIfAbsent(lecturerId, k -> new ArrayList<>()).add(student);
            }

            // Allocate slots per lecturer
            for (Map.Entry<Long, List<StudentAssignmentInput>> entry : lecturerApplicants.entrySet()) {
                Long lecturerId = entry.getKey();
                List<StudentAssignmentInput> applicants = entry.getValue();
                LecturerAssignmentInput lecturer = lecturerMap.get(lecturerId);

                // Applicants are already sorted by GPA descending
                for (StudentAssignmentInput student : applicants) {
                    if (lecturer.getRemainingCapacity() > 0 && unassignedStudentIds.contains(student.getStudentId())) {
                        lecturer.setCurrentAssigned(lecturer.getCurrentAssigned() + 1);
                        unassignedStudentIds.remove(student.getStudentId());

                        double score = constraints.calculateMatchingScore(currentPriority, student.getGpa(), lecturer.getLoadRatio());

                        AssignmentMatchResult result = AssignmentMatchResult.builder()
                                .studentId(student.getStudentId())
                                .lecturerId(lecturerId)
                                .directionId(student.getDirectionId())
                                .matchedPriority(currentPriority)
                                .matchScore(score)
                                .status("PROPOSED")
                                .assignmentMethod("ALGORITHM")
                                .notes("Matched via NV" + currentPriority)
                                .build();

                        assignments.put(student.getStudentId(), result);
                    }
                }
            }
        }

        // ==========================================
        // Phase 2: Fallback Allocation with Load Balancing
        // ==========================================
        log.info("Processing fallback allocation for {} unassigned students", unassignedStudentIds.size());
        for (StudentAssignmentInput student : sortedStudents) {
            if (!unassignedStudentIds.contains(student.getStudentId())) {
                continue;
            }

            // Find eligible lecturers in the same direction who satisfy degree and have capacity
            List<LecturerAssignmentInput> eligibleLecturers = lecturers.stream()
                    .filter(l -> l.getRemainingCapacity() > 0)
                    .filter(l -> constraints.checkDegreeConstraint(student.getTrainingProgramCode(), l.getAcademicDegree()))
                    .filter(l -> constraints.checkDirectionConstraint(student.getDirectionId(), l.getDirectionIds()))
                    .sorted(Comparator.comparingDouble(LecturerAssignmentInput::getLoadRatio)
                            .thenComparing(Comparator.comparingInt(LecturerAssignmentInput::getRemainingCapacity).reversed()))
                    .collect(Collectors.toList());

            if (!eligibleLecturers.isEmpty()) {
                LecturerAssignmentInput chosen = eligibleLecturers.get(0);
                chosen.setCurrentAssigned(chosen.getCurrentAssigned() + 1);
                unassignedStudentIds.remove(student.getStudentId());

                double score = constraints.calculateMatchingScore(null, student.getGpa(), chosen.getLoadRatio());

                AssignmentMatchResult result = AssignmentMatchResult.builder()
                        .studentId(student.getStudentId())
                        .lecturerId(chosen.getLecturerId())
                        .directionId(student.getDirectionId())
                        .matchedPriority(0)
                        .matchScore(score)
                        .status("PROPOSED")
                        .assignmentMethod("ALGORITHM")
                        .notes("Phân công fallback tự động theo cân bằng tải hướng đề tài")
                        .build();

                assignments.put(student.getStudentId(), result);
            } else {
                // Cannot allocate
                AssignmentMatchResult unassignedResult = AssignmentMatchResult.builder()
                        .studentId(student.getStudentId())
                        .lecturerId(null)
                        .directionId(student.getDirectionId())
                        .matchedPriority(null)
                        .matchScore(0.0)
                        .status("UNASSIGNED")
                        .assignmentMethod("ALGORITHM")
                        .notes("Không tìm thấy giảng viên còn chỉ tiêu hoặc thỏa mãn học vị trong hướng đồ án đã chọn")
                        .build();

                assignments.put(student.getStudentId(), unassignedResult);
            }
        }

        return new ArrayList<>(assignments.values());
    }
}
