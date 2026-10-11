package com.example.thesis_hub_api.identity;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.dto.request.ChangePasswordRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.LoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.LoginResponseDTO;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.identity.security.JwtTokenProvider;
import com.example.thesis_hub_api.identity.service.AuthService;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private LecturerRepository lecturerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder()
                .id(1L)
                .name("ROLE_STUDENT")
                .displayName("Sinh viên")
                .build();

        sampleUser = User.builder()
                .id(10L)
                .username("student01")
                .email("student01@utc.edu.vn")
                .password("$2a$10$hashedPassword")
                .fullName("Nguyen Van B")
                .role(studentRole)
                .isActive(true)
                .build();
    }

    @Test
    void testLogin_Success() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("student01")
                .password("password123")
                .build();

        when(userRepository.findByUsernameOrEmail("student01", "student01"))
                .thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateTokenFromUser(any())).thenReturn("mock.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponseDTO response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("student01", response.getUsername());
        assertEquals("ROLE_STUDENT", response.getRole());
    }

    @Test
    void testLogin_UserNotFound() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("nonexistent")
                .password("password123")
                .build();

        when(userRepository.findByUsernameOrEmail("nonexistent", "nonexistent")).thenReturn(Optional.empty());
        when(studentRepository.findByStudentCode("nonexistent")).thenReturn(Optional.empty());
        when(lecturerRepository.findByLecturerCode("nonexistent")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.USER_NOT_EXISTED, ex.getErrorCode());
    }

    @Test
    void testLogin_UserInactive() {
        sampleUser.setIsActive(false);
        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("student01")
                .password("password123")
                .build();

        when(userRepository.findByUsernameOrEmail("student01", "student01"))
                .thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.USER_LOCKED, ex.getErrorCode());
    }

    @Test
    void testLogin_InvalidPassword() {
        LoginRequestDTO request = LoginRequestDTO.builder()
                .username("student01")
                .password("wrongpassword")
                .build();

        when(userRepository.findByUsernameOrEmail("student01", "student01"))
                .thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "$2a$10$hashedPassword")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals(ErrorCode.INVALID_PASSWORD, ex.getErrorCode());
    }

    @Test
    void testChangePassword_Success() {
        ChangePasswordRequestDTO request = ChangePasswordRequestDTO.builder()
                .oldPassword("oldPass123")
                .newPassword("newPass456")
                .confirmPassword("newPass456")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass123", "$2a$10$hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass456")).thenReturn("$2a$10$newHashedPassword");

        authService.changePassword(10L, request);

        verify(userRepository, times(1)).save(sampleUser);
        assertEquals("$2a$10$newHashedPassword", sampleUser.getPassword());
    }

    @Test
    void testChangePassword_OldPasswordMismatch() {
        ChangePasswordRequestDTO request = ChangePasswordRequestDTO.builder()
                .oldPassword("wrongOldPass")
                .newPassword("newPass456")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongOldPass", "$2a$10$hashedPassword")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> authService.changePassword(10L, request));
        assertEquals(ErrorCode.OLD_PASSWORD_INCORRECT, ex.getErrorCode());
    }
}
