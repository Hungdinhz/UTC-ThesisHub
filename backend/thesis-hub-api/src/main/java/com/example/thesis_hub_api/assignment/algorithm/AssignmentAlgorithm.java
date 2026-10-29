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

            // Tìm giảng viên còn chỉ tiêu và thỏa mãn điều kiện học vị (KY_SU phải từ Tiến sĩ trở lên)
            List<LecturerAssignmentInput> eligibleLecturers = lecturers.stream()
                    .filter(l -> l.getRemainingCapacity() > 0)
                    .filter(l -> constraints.checkDegreeConstraint(student.getTrainingProgramCode(), l.getAcademicDegree()))
                    .sorted((l1, l2) -> {
                        // 1. Giảng viên đang có nhiều chỉ tiêu nhất (remainingCapacity DESC)
                        int cmpCapacity = Integer.compare(l2.getRemainingCapacity(), l1.getRemainingCapacity());
                        if (cmpCapacity != 0) {
                            return cmpCapacity;
                        }

                        // 2. Ưu tiên cùng hướng đồ án nếu chỉ tiêu còn lại bằng nhau
                        boolean l1SameDir = l1.getDirectionIds() != null && l1.getDirectionIds().contains(student.getDirectionId());
                        boolean l2SameDir = l2.getDirectionIds() != null && l2.getDirectionIds().contains(student.getDirectionId());
                        if (l1SameDir != l2SameDir) {
                            return l1SameDir ? -1 : 1;
                        }

                        // 3. Cân bằng tải: loadRatio ASC
                        int cmpLoad = Double.compare(l1.getLoadRatio(), l2.getLoadRatio());
                        if (cmpLoad != 0) {
                            return cmpLoad;
                        }

                        return Long.compare(l1.getLecturerId(), l2.getLecturerId());
                    })
                    .collect(Collectors.toList());

            if (!eligibleLecturers.isEmpty()) {
                LecturerAssignmentInput chosen = eligibleLecturers.get(0);
                chosen.setCurrentAssigned(chosen.getCurrentAssigned() + 1);
                unassignedStudentIds.remove(student.getStudentId());

                // Xác định hướng đồ án: nếu giảng viên có cùng hướng thì giữ hướng đó,
                // ngược lại phân bổ sang 1 hướng bất kì của giảng viên được chọn
                Long assignedDirectionId = student.getDirectionId();
                boolean isSameDirection = chosen.getDirectionIds() != null && chosen.getDirectionIds().contains(student.getDirectionId());
                if (!isSameDirection) {
                    if (chosen.getDirectionIds() != null && !chosen.getDirectionIds().isEmpty()) {
                        assignedDirectionId = chosen.getDirectionIds().get(0); // 1 hướng bất kì của giảng viên
                    }
                }

                double score = constraints.calculateMatchingScore(null, student.getGpa(), chosen.getLoadRatio());

                String note = isSameDirection
                        ? "Phân công tự động cho GV còn nhiều chỉ tiêu nhất (" + chosen.getRemainingCapacity() + " chỉ tiêu còn lại)"
                        : "Phân công sang GV còn nhiều chỉ tiêu nhất (" + chosen.getRemainingCapacity() + " chỉ tiêu còn lại) và 1 hướng bất kì do GV/hướng đăng ký đã hết chỉ tiêu";

                AssignmentMatchResult result = AssignmentMatchResult.builder()
                        .studentId(student.getStudentId())
                        .lecturerId(chosen.getLecturerId())
                        .directionId(assignedDirectionId)
                        .matchedPriority(0)
                        .matchScore(score)
                        .status("PROPOSED")
                        .assignmentMethod("ALGORITHM")
                        .notes(note)
                        .build();

                assignments.put(student.getStudentId(), result);
            } else {
                // Không còn giảng viên nào còn chỉ tiêu hoặc thỏa mãn học vị
                AssignmentMatchResult unassignedResult = AssignmentMatchResult.builder()
                        .studentId(student.getStudentId())
                        .lecturerId(null)
                        .directionId(student.getDirectionId())
                        .matchedPriority(null)
                        .matchScore(0.0)
                        .status("UNASSIGNED")
                        .assignmentMethod("ALGORITHM")
                        .notes("Không tìm thấy giảng viên nào còn chỉ tiêu hoặc thỏa mãn học vị trong đợt đồ án")
                        .build();

                assignments.put(student.getStudentId(), unassignedResult);
            }
        }

        return new ArrayList<>(assignments.values());
    }
}
