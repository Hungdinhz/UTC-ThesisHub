package com.example.thesis_hub_api.organization.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerResponseDTO {

    private Long lecturerId;
    private Long userId;
    private String lecturerCode;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String academicDegree; // THAC_SI, TIEN_SI, PGS, GS, OTHER
    private Long departmentId;
    private String departmentName;
    private Long facultyId;
    private String facultyName;
    private String researchInterests;
    private Integer maxThesisQuota;
    private Boolean isActive;
    private java.util.List<String> projectRoundCodes;
    private java.util.List<String> projectRoundNames;
}
