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
public class AcademicRecordImportRowDTO {

    private int rowIndex;
    private Integer stt;
    private String studentCode;
    private String fullName;
    private Integer completedCredits;
    private Double gpa;
    private Boolean tuitionDebt;
    private Boolean underDisciplinaryAction;
    private Integer missingPrerequisiteCount;
    private String note;

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
