package com.example.thesis_hub_api.identity.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequestDTO {

    private String oldPassword;

    @JsonProperty("old_password")
    private String oldPasswordSnake;

    private String newPassword;

    @JsonProperty("new_password")
    private String newPasswordSnake;

    private String confirmPassword;

    @JsonProperty("confirm_password")
    private String confirmPasswordSnake;

    public String getActualOldPassword() {
        return StringUtils.hasText(oldPassword) ? oldPassword : oldPasswordSnake;
    }

    public String getActualNewPassword() {
        return StringUtils.hasText(newPassword) ? newPassword : newPasswordSnake;
    }

    public String getActualConfirmPassword() {
        return StringUtils.hasText(confirmPassword) ? confirmPassword : confirmPasswordSnake;
    }
}
