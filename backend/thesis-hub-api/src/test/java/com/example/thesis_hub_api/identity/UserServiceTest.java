package com.example.thesis_hub_api.identity;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.dto.request.CreateUserRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateProfileRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateUserRoleRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.UpdateUserStatusRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.UserProfileResponseDTO;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.identity.service.UserService;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private LecturerRepository lecturerRepository;

    @Mock
    private com.example.thesis_hub_api.organization.repository.TrainingProgramRepository trainingProgramRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private Role studentRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
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
                .id(5L)
                .username("hungpd")
                .email("hungpd@utc.edu.vn")
                .fullName("Phung Dinh Hung")
                .role(studentRole)
                .isActive(true)
                .build();
    }

    @Test
    void testGetCurrentUserProfile_Success() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(studentRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(lecturerRepository.findByUserId(5L)).thenReturn(Optional.empty());

        UserProfileResponseDTO profile = userService.getCurrentUserProfile(5L);

        assertNotNull(profile);
        assertEquals("hungpd", profile.getUsername());
        assertEquals("ROLE_STUDENT", profile.getRole());
        assertEquals("student", profile.getUserType());
    }

    @Test
    void testUpdateCurrentUserProfile_Success() {
        UpdateProfileRequestDTO dto = UpdateProfileRequestDTO.builder()
                .fullName("Phung Dinh Hung Updated")
                .phone("0987654321")
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(studentRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(lecturerRepository.findByUserId(5L)).thenReturn(Optional.empty());

        UserProfileResponseDTO updated = userService.updateCurrentUserProfile(5L, dto);

        assertNotNull(updated);
        assertEquals("Phung Dinh Hung Updated", updated.getFullName());
        assertEquals("0987654321", updated.getPhone());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void testCreateUser_Success() {
        CreateUserRequestDTO dto = CreateUserRequestDTO.builder()
                .username("newstudent")
                .email("new@utc.edu.vn")
                .password("password123")
                .fullName("New Student")
                .roleName("ROLE_STUDENT")
                .studentCode("SV202601")
                .build();

        when(userRepository.existsByUsername("newstudent")).thenReturn(false);
        when(userRepository.existsByEmail("new@utc.edu.vn")).thenReturn(false);
        when(roleRepository.findByName("ROLE_STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encoded");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(studentRepository.existsByStudentCode("SV202601")).thenReturn(false);

        UserProfileResponseDTO created = userService.createUser(dto);

        assertNotNull(created);
        verify(userRepository, times(1)).save(any(User.class));
        verify(studentRepository, times(1)).save(any());
    }

    @Test
    void testCreateUser_UsernameExists() {
        CreateUserRequestDTO dto = CreateUserRequestDTO.builder()
                .username("hungpd")
                .email("new@utc.edu.vn")
                .build();

        when(userRepository.existsByUsername("hungpd")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> userService.createUser(dto));
        assertEquals(ErrorCode.USER_EXISTED, ex.getErrorCode());
    }

    @Test
    void testUpdateUserStatus_Success() {
        UpdateUserStatusRequestDTO dto = new UpdateUserStatusRequestDTO(false);
        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        UserProfileResponseDTO updated = userService.updateUserStatus(5L, dto);

        assertNotNull(updated);
        assertFalse(sampleUser.getIsActive());
    }

    @Test
    void testUpdateUserRole_Success() {
        UpdateUserRoleRequestDTO dto = UpdateUserRoleRequestDTO.builder()
                .roleName("ROLE_ADMIN")
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(sampleUser));
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        UserProfileResponseDTO updated = userService.updateUserRole(5L, dto);

        assertNotNull(updated);
        assertEquals("ROLE_ADMIN", sampleUser.getRole().getName());
    }
}
