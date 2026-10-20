package com.example.thesis_hub_api.organization;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.dto.request.CreateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateResearchInterestsDTO;
import com.example.thesis_hub_api.organization.dto.response.LecturerResponseDTO;
import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.organization.entity.Faculty;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.repository.DepartmentRepository;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.service.LecturerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LecturerServiceTest {

    @Mock
    private LecturerRepository lecturerRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private LecturerService lecturerService;

    private Faculty sampleFaculty;
    private Department sampleDepartment;
    private User sampleUser;
    private Lecturer sampleLecturer;
    private Role lecturerRole;

    @BeforeEach
    void setUp() {
        sampleFaculty = Faculty.builder()
                .id(1L)
                .code("CNTT")
                .name("Công nghệ thông tin")
                .build();

        sampleDepartment = Department.builder()
                .id(10L)
                .faculty(sampleFaculty)
                .code("CNPM")
                .name("Công nghệ phần mềm")
                .build();

        lecturerRole = Role.builder()
                .id(3L)
                .name("ROLE_LECTURER")
                .description("Giảng viên hướng dẫn")
                .build();

        sampleUser = User.builder()
                .id(20L)
                .username("giangvien")
                .email("giangvien@utc.edu.vn")
                .fullName("TS. Nguyễn Văn Hướng")
                .phone("0987654321")
                .role(lecturerRole)
                .isActive(true)
                .build();

        sampleLecturer = Lecturer.builder()
                .id(501L)
                .user(sampleUser)
                .lecturerCode("GV001")
                .departmentId(10L)
                .academicDegree("TIEN_SI")
                .researchInterests("Trí tuệ nhân tạo, Xử lý ảnh")
                .maxThesisQuota(5)
                .build();
    }

    @Test
    @DisplayName("CONTRACT 1: Tra cứu giảng viên theo bộ môn/học vị/từ khóa trả về đúng chuẩn DTO")
    void getLecturers_Contract1_Success() {
        when(lecturerRepository.findLecturersFiltered(eq(10L), eq("TIEN_SI"), any()))
                .thenReturn(List.of(sampleLecturer));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));

        List<LecturerResponseDTO> result = lecturerService.getLecturers(10L, "TIEN_SI", "Hướng");

        assertNotNull(result);
        assertEquals(1, result.size());
        LecturerResponseDTO dto = result.get(0);
        assertEquals(501L, dto.getLecturerId());
        assertEquals("GV001", dto.getLecturerCode());
        assertEquals("TS. Nguyễn Văn Hướng", dto.getFullName());
        assertEquals("giangvien@utc.edu.vn", dto.getEmail());
        assertEquals("TIEN_SI", dto.getAcademicDegree());
        assertEquals("Công nghệ phần mềm", dto.getDepartmentName());
        assertEquals("Công nghệ thông tin", dto.getFacultyName());
        assertEquals("Trí tuệ nhân tạo, Xử lý ảnh", dto.getResearchInterests());
        assertEquals(5, dto.getMaxThesisQuota());
        assertTrue(dto.getIsActive());
    }

    @Test
    @DisplayName("Lấy chi tiết giảng viên theo ID thành công")
    void getLecturerById_Success() {
        when(lecturerRepository.findById(501L)).thenReturn(Optional.of(sampleLecturer));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));

        LecturerResponseDTO result = lecturerService.getLecturerById(501L);

        assertNotNull(result);
        assertEquals(501L, result.getLecturerId());
        assertEquals("GV001", result.getLecturerCode());
    }

    @Test
    @DisplayName("Lấy hồ sơ giảng viên theo userId thành công")
    void getLecturerByUserId_Success() {
        when(lecturerRepository.findByUserId(20L)).thenReturn(Optional.of(sampleLecturer));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));

        LecturerResponseDTO result = lecturerService.getLecturerByUserId(20L);

        assertNotNull(result);
        assertEquals(20L, result.getUserId());
        assertEquals("GV001", result.getLecturerCode());
    }

    @Test
    @DisplayName("Tạo mới giảng viên thành công")
    void createLecturer_Success() {
        CreateLecturerRequestDTO req = CreateLecturerRequestDTO.builder()
                .username("newgv")
                .email("newgv@utc.edu.vn")
                .password("Password@123")
                .fullName("ThS. Lê Hoàng")
                .phone("0912345678")
                .lecturerCode("GV002")
                .departmentId(10L)
                .academicDegree("THAC_SI")
                .researchInterests("Hệ phân tán")
                .maxThesisQuota(4)
                .build();

        when(userRepository.existsByUsername("newgv")).thenReturn(false);
        when(userRepository.existsByEmail("newgv@utc.edu.vn")).thenReturn(false);
        when(lecturerRepository.existsByLecturerCode("GV002")).thenReturn(false);
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));
        when(roleRepository.findByName("ROLE_LECTURER")).thenReturn(Optional.of(lecturerRole));
        when(passwordEncoder.encode("Password@123")).thenReturn("$2a$10$encodedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(21L);
            return u;
        });

        when(lecturerRepository.save(any(Lecturer.class))).thenAnswer(inv -> {
            Lecturer l = inv.getArgument(0);
            l.setId(502L);
            return l;
        });

        LecturerResponseDTO result = lecturerService.createLecturer(req);

        assertNotNull(result);
        assertEquals(502L, result.getLecturerId());
        assertEquals("GV002", result.getLecturerCode());
        assertEquals("THAC_SI", result.getAcademicDegree());
        verify(passwordEncoder).encode("Password@123");
    }

    @Test
    @DisplayName("Cập nhật hướng nghiên cứu cá nhân của giảng viên")
    void updateMyResearchInterests_Success() {
        UpdateResearchInterestsDTO req = new UpdateResearchInterestsDTO("Cloud Computing, Microservices");

        when(lecturerRepository.findByUserId(20L)).thenReturn(Optional.of(sampleLecturer));
        when(lecturerRepository.save(any(Lecturer.class))).thenReturn(sampleLecturer);
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(sampleDepartment));

        LecturerResponseDTO result = lecturerService.updateMyResearchInterests(20L, req);

        assertNotNull(result);
        assertEquals("Cloud Computing, Microservices", sampleLecturer.getResearchInterests());
        verify(lecturerRepository).save(sampleLecturer);
    }
}
