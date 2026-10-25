package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEligibilityCheckResponseDTO {

    private String studentCode;
    private boolean eligible;
    private String message;
    private boolean existsInSystem;
    private Long studentId;
    private String fullName;
    private String className;
    private Long majorId;
    private String majorName;
    private String email;
    private String phone;
}
