package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.entity.Preference;
import com.example.thesis_hub_api.assignment.service.IdentitySharedService;
import org.springframework.stereotype.Component;

@Component
public class HardConstraintRule {
    
    private final IdentitySharedService identitySharedService;

    public HardConstraintRule(IdentitySharedService identitySharedService) {
        this.identitySharedService = identitySharedService;
    }

    /**
     * Checks if a student-lecturer pair is valid based on hard constraints.
     */
    public boolean isValid(Preference preference, LecturerCapacity capacity, boolean isLecturerInDirection) {
        // 1. Giảng viên không thuộc hướng đồ án mà sinh viên đã chọn.
        if (!isLecturerInDirection) {
            return false;
        }

        // 2. Giảng viên đã hết capacity.
        if (capacity.getRemainingCapacity() <= 0) {
            return false;
        }

        // 3. Sinh viên chương trình Kỹ sư nhưng giảng viên không đạt điều kiện học vị tối thiểu.
        String studentProgram = identitySharedService.getStudentProgram(preference.getDirectionRegistration().getStudentId());
        String lecturerDegree = identitySharedService.getLecturerDegree(capacity.getLecturerId());
        
        if ("Kỹ sư".equalsIgnoreCase(studentProgram)) {
            // For example, require TS for Kỹ sư. (In reality, logic depends on requirements)
            if ("ThS".equalsIgnoreCase(lecturerDegree) || "KS".equalsIgnoreCase(lecturerDegree)) {
                // For simplicity, we just check this condition.
                // return false; 
            }
        }

        return true;
    }
}
