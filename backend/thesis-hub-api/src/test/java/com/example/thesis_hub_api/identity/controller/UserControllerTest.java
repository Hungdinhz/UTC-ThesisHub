package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.exception.GlobalExceptionHandler;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.dto.request.CreateUserRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateProfileRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateUserRoleRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateUserStatusRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.UserProfileResponseDTO;
import com.example.thesis_hub_api.identity.service.UserService;
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

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private UserProfileResponseDTO sampleProfile;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleProfile = UserProfileResponseDTO.builder()
                .id(1L)
                .username("admin")
                .email("admin@utc.edu.vn")
                .fullName("Quản trị viên")
                .role("ROLE_ADMIN")
                .roleDisplayName("Quản trị viên")
                .userType("admin")
                .isActive(true)
                .build();
    }

    @Test
    void testGetUsers_Success() throws Exception {
        PageResponse<UserProfileResponseDTO> pageResponse = PageResponse.<UserProfileResponseDTO>builder()
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .content(Collections.singletonList(sampleProfile))
                .build();

        when(userService.getUsers(any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].username").value("admin"));
    }

    @Test
    void testGetUserById_Success() throws Exception {
        when(userService.getUserById(1L)).thenReturn(sampleProfile);

        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("admin"));
    }

    @Test
    void testCreateUser_Success() throws Exception {
        CreateUserRequestDTO request = CreateUserRequestDTO.builder()
                .username("newuser")
                .email("new@utc.edu.vn")
                .password("password123")
                .fullName("New User")
                .roleName("ROLE_STUDENT")
                .build();

        when(userService.createUser(any(CreateUserRequestDTO.class))).thenReturn(sampleProfile);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testUpdateUserStatus_Success() throws Exception {
        UpdateUserStatusRequestDTO request = new UpdateUserStatusRequestDTO(false);
        when(userService.updateUserStatus(eq(1L), any(UpdateUserStatusRequestDTO.class)))
                .thenReturn(sampleProfile);

        mockMvc.perform(patch("/api/v1/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testUpdateUserRole_Success() throws Exception {
        UpdateUserRoleRequestDTO request = UpdateUserRoleRequestDTO.builder()
                .roleName("ROLE_LECTURER")
                .build();

        when(userService.updateUserRole(eq(1L), any(UpdateUserRoleRequestDTO.class)))
                .thenReturn(sampleProfile);

        mockMvc.perform(put("/api/v1/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
