package com.example.thesis_hub_api.projectround.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportRowDTO {

    private int rowIndex;
    private Integer stt;
    private String studentCode;
    private String lastName;   // Họ đệm
    private String firstName;  // Tên
    private String fullName;   // Họ và tên kết hợp
    private String majorCode;  // Mã ngành (VD: CNTT, KHMT)
    private String className;  // Lớp sinh hoạt (VD: CNTT 1 - K62)
    private String phone;      // Số điện thoại
    private String email;      // Email
    private Double gpa; // Điểm GPA tích lũy

    // Dữ liệu học vụ tích hợp (All-in-One Import)
    private Integer completedCredits; // Tín chỉ tích lũy (VD: 115)
    private Integer debtCredits; // Tín chỉ nợ (VD: 0, 6, 12)
    private Boolean tuitionDebt; // Nợ học phí (true/false)
    private Boolean underDisciplinaryAction; // Bị kỷ luật (true/false)
    private Integer missingPrerequisiteCount; // Số môn tiên quyết còn nợ
    private String academicStatus; // ELIGIBLE hoặc INELIGIBLE

    @JsonProperty("isValid")
    @JsonAlias({"valid", "isValid"})
    private boolean isValid;

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    @JsonProperty("isValid")
    public boolean isValid() {
        return isValid;
    }

    @JsonProperty("isValid")
    @JsonAlias({"valid", "isValid"})
    public void setValid(boolean isValid) {
        this.isValid = isValid;
    }
}
