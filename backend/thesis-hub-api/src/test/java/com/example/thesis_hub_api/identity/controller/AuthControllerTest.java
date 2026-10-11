package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.exception.GlobalExceptionHandler;
import com.example.thesis_hub_api.identity.dto.request.LoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.LoginResponseDTO;
import com.example.thesis_hub_api.identity.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private LoginResponseDTO sampleLoginResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleLoginResponse = LoginResponseDTO.builder()
                .token("sample.jwt.token")
                .access("sample.jwt.token")
                .type("Bearer")
                .userId(1L)
                .username("admin")
                .email("admin@utc.edu.vn")
                .role("ROLE_ADMIN")
                .expiresIn(86400000L)
                .build();
    }

    @Test
    void testLogin_Success() throws Exception {
        when(authService.login(any(LoginRequestDTO.class))).thenReturn(sampleLoginResponse);

        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("admin")
                .password("Admin@123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("sample.jwt.token"))
                .andExpect(jsonPath("$.data.access").value("sample.jwt.token"))
                .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN"));
    }

    @Test
    void testStudentLogin_AliasEndpoint() throws Exception {
        when(authService.login(any(LoginRequestDTO.class))).thenReturn(sampleLoginResponse);

        String json = """
                {
                    "registration_no": "2021601234",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/students/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("sample.jwt.token"));
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequestDTO.class)))
                .thenThrow(new AppException(ErrorCode.INVALID_PASSWORD));

        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("admin")
                .password("WrongPassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_PASSWORD.getCode()))
                .andExpect(jsonPath("$.success").value(false));
    }
}
