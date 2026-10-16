package com.example.thesis_hub_api.assignment.algorithm;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Hard constraints and soft constraints validator for supervisor assignment.
 */
@Component
public class AssignmentConstraints {

    // Minimum degrees allowed for Engineering (KY_SU) students
    private static final List<String> QUALIFIED_ENGINEERING_DEGREES = Arrays.asList("TIEN_SI", "PGS", "GS", "DOCTOR", "PROFESSOR", "ASSOCIATE_PROFESSOR");

    /**
     * Hard constraint 1: Degree validation.
     * Engineering (KY_SU) students must have a supervisor with at least a Doctoral degree (TIEN_SI, PGS, GS).
     * Bachelor (CU_NHAN) students can be supervised by Master (THAC_SI) or higher.
     *
     * @param trainingProgramCode e.g. "KY_SU" or "CU_NHAN"
     * @param lecturerDegree e.g. "TIEN_SI", "THAC_SI", "PGS", "GS"
     * @return true if degree requirement is satisfied
     */
    public boolean checkDegreeConstraint(String trainingProgramCode, String lecturerDegree) {
        if (trainingProgramCode == null || lecturerDegree == null) {
            return true;
        }
        if ("KY_SU".equalsIgnoreCase(trainingProgramCode)) {
            String degreeUpper = lecturerDegree.toUpperCase().trim();
            return QUALIFIED_ENGINEERING_DEGREES.contains(degreeUpper);
        }
        return true;
    }

    /**
     * Hard constraint 2: Direction match.
     * Checks if the lecturer is eligible to supervise the student's chosen direction.
     */
    public boolean checkDirectionConstraint(Long studentDirectionId, List<Long> lecturerDirectionIds) {
        if (studentDirectionId == null || lecturerDirectionIds == null || lecturerDirectionIds.isEmpty()) {
            return false;
        }
        return lecturerDirectionIds.contains(studentDirectionId);
    }

    /**
     * Hard constraint 3: Capacity limit.
     * Checks if lecturer has available capacity slot.
     */
    public boolean checkCapacityConstraint(int currentAssigned, int effectiveCapacity) {
        return currentAssigned < effectiveCapacity;
    }

    /**
     * Soft constraint: Compute preference score.
     * NV1: 100 points
     * NV2: 60 points
     * NV3: 30 points
     * Fallback / Non-preference: 10 points
     * Added with normalized GPA bonus (up to 10 points for 4.0 scale) and load balancing factor.
     */
    public double calculateMatchingScore(Integer priority, Double gpa, double currentLoadRatio) {
        double baseScore = 0.0;
        if (priority != null) {
            switch (priority) {
                case 1: baseScore = 100.0; break;
                case 2: baseScore = 60.0; break;
                case 3: baseScore = 30.0; break;
                default: baseScore = 10.0; break;
            }
        } else {
            baseScore = 10.0;
        }

        // GPA bonus (scale 0-4.0 -> up to 10 points)
        double gpaBonus = 0.0;
        if (gpa != null && gpa > 0) {
            gpaBonus = Math.min(10.0, (gpa / 4.0) * 10.0);
        }

        // Load penalty: higher load on lecturer slightly reduces tie-breaking score to balance loads
        double loadPenalty = currentLoadRatio * 5.0;

        return Math.round((baseScore + gpaBonus - loadPenalty) * 100.0) / 100.0;
    }
}
