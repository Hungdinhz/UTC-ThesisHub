package com.example.thesis_hub_api.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {

    private String token;

    // Frontend compatibility alias
    private String access;

    private String refreshToken;

    // Frontend compatibility alias
    private String refresh;

    @Builder.Default
    private String type = "Bearer";

    private Long userId;

    private String username;

    private String email;

    private String fullName;

    private String role;

    private Long expiresIn;

    private String expireTime;

    // Snake case alias
    @JsonProperty("expire_time")
    private String expireTimeSnake;
}
