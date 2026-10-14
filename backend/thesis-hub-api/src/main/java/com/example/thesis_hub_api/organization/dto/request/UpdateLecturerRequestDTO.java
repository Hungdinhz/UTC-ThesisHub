package com.example.thesis_hub_api.organization.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLecturerRequestDTO {

    private String fullName;
    private String phone;
    private Long departmentId;
    private String academicDegree; // THAC_SI, TIEN_SI, PGS, GS, OTHER
    private String researchInterests;
    private Integer maxThesisQuota;
    private Boolean isActive;
}
