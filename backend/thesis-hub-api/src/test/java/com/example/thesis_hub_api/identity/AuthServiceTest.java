package com.example.thesis_hub_api.identity;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.dto.request.AdminLoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.AdminRegisterRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.ChangePasswordRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.LoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.LoginResponseDTO;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

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
    private Role adminRole;

    private static final String TEST_ADMIN_KEY = "test_admin_key_123";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "adminRegistrationKey", TEST_ADMIN_KEY);
        ReflectionTestUtils.setField(authService, "requireKeyOnLogin", false);

        studentRole = Role.builder()
                .id(1L)
                .name("ROLE_STUDENT")
                .displayName("Sinh viên")
                .build();

        adminRole = Role.builder()
                .id(2L)
                .name("ROLE_ADMIN")
                .displayName("Quản trị viên")
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
    void testRegisterAdmin_Success() {
        AdminRegisterRequestDTO request = AdminRegisterRequestDTO.builder()
                .username("newadmin")
                .email("newadmin@utc.edu.vn")
                .password("Secret@123")
                .confirmPassword("Secret@123")
                .fullName("Quản trị viên Mới")
                .phone("0988776655")
                .adminSecretKey(TEST_ADMIN_KEY)
                .build();

        when(userRepository.existsByUsername("newadmin")).thenReturn(false);
        when(userRepository.existsByEmail("newadmin@utc.edu.vn")).thenReturn(false);
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode("Secret@123")).thenReturn("$2a$10$encodedAdminPass");

        User savedUser = User.builder()
                .id(99L)
                .username("newadmin")
                .email("newadmin@utc.edu.vn")
                .password("$2a$10$encodedAdminPass")
                .fullName("Quản trị viên Mới")
                .role(adminRole)
                .isActive(true)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateTokenFromUser(any())).thenReturn("mock.admin.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponseDTO response = authService.registerAdmin(request);

        assertNotNull(response);
        assertEquals("mock.admin.token", response.getToken());
        assertEquals("newadmin", response.getUsername());
        assertEquals("ROLE_ADMIN", response.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterAdmin_InvalidSecretKey() {
        AdminRegisterRequestDTO request = AdminRegisterRequestDTO.builder()
                .username("newadmin")
                .email("newadmin@utc.edu.vn")
                .password("Secret@123")
                .confirmPassword("Secret@123")
                .fullName("Quản trị viên Mới")
                .adminSecretKey("wrong_secret_key")
                .build();

        AppException ex = assertThrows(AppException.class, () -> authService.registerAdmin(request));
        assertEquals(ErrorCode.INVALID_ADMIN_SECRET_KEY, ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegisterAdmin_PasswordMismatch() {
        AdminRegisterRequestDTO request = AdminRegisterRequestDTO.builder()
                .username("newadmin")
                .email("newadmin@utc.edu.vn")
                .password("Secret@123")
                .confirmPassword("DifferentPass@123")
                .fullName("Quản trị viên Mới")
                .adminSecretKey(TEST_ADMIN_KEY)
                .build();

        AppException ex = assertThrows(AppException.class, () -> authService.registerAdmin(request));
        assertEquals(ErrorCode.CONFIRM_PASSWORD_MISMATCH, ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegisterAdmin_UserExisted() {
        AdminRegisterRequestDTO request = AdminRegisterRequestDTO.builder()
                .username("newadmin")
                .email("newadmin@utc.edu.vn")
                .password("Secret@123")
                .confirmPassword("Secret@123")
                .fullName("Quản trị viên Mới")
                .adminSecretKey(TEST_ADMIN_KEY)
                .build();

        when(userRepository.existsByUsername("newadmin")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> authService.registerAdmin(request));
        assertEquals(ErrorCode.USER_EXISTED, ex.getErrorCode());
    }

    @Test
    void testAdminLogin_Success() {
        User adminUser = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@utc.edu.vn")
                .password("$2a$10$adminHash")
                .role(adminRole)
                .isActive(true)
                .build();

        AdminLoginRequestDTO request = AdminLoginRequestDTO.builder()
                .username("admin")
                .password("Admin@123")
                .build();

        when(userRepository.findByUsernameOrEmail("admin", "admin")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("Admin@123", "$2a$10$adminHash")).thenReturn(true);
        when(jwtTokenProvider.generateTokenFromUser(any())).thenReturn("mock.admin.jwt");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        LoginResponseDTO response = authService.adminLogin(request);
        assertNotNull(response);
        assertEquals("ROLE_ADMIN", response.getRole());
    }

    @Test
    void testAdminLogin_NotAdminRole() {
        AdminLoginRequestDTO request = AdminLoginRequestDTO.builder()
                .username("student01")
                .password("password123")
                .build();

        when(userRepository.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () -> authService.adminLogin(request));
        assertEquals(ErrorCode.NOT_AN_ADMIN_ACCOUNT, ex.getErrorCode());
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
