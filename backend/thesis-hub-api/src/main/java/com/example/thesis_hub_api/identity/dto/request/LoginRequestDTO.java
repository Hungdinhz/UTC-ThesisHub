package com.example.thesis_hub_api.identity.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {

    private String username;

    private String email;

    @JsonProperty("registration_no")
    private String registrationNo;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    public String getLoginIdentifier() {
        if (StringUtils.hasText(username)) {
            return username.trim();
        }
        if (StringUtils.hasText(registrationNo)) {
            return registrationNo.trim();
        }
        if (StringUtils.hasText(email)) {
            return email.trim();
        }
        return "";
    }
}
