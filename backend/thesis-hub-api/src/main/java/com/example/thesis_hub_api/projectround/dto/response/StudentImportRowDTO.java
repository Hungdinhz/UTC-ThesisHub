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
