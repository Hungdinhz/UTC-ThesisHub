package com.example.thesis_hub_api.organization;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.dto.request.CreateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateStudentRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.StudentResponseDTO;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.organization.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private TrainingProgramRepository trainingProgramRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private StudentService studentService;

    private User sampleUser;
    private Student sampleStudent;
    private Major sampleMajor;
    private TrainingProgram sampleProgram;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder()
                .id(2L)
                .name("ROLE_STUDENT")
                .description("Sinh viên thực hiện đồ án")
                .build();

        sampleUser = User.builder()
                .id(10L)
                .username("sinhvien")
                .email("sinhvien@student.utc.edu.vn")
                .fullName("Nguyễn Văn Sinh Viên")
                .phone("0981112233")
                .role(studentRole)
                .isActive(true)
                .build();

        sampleMajor = Major.builder()
                .id(100L)
                .code("7480201")
                .name("Công nghệ thông tin")
                .build();

        sampleProgram = TrainingProgram.builder()
                .id(1L)
                .code("CU_NHAN")
                .name("Cử nhân")
                .build();

        sampleStudent = Student.builder()
                .id(101L)
                .user(sampleUser)
                .studentCode("2021601234")
                .className("CNTT1 - K62")
                .majorId(100L)
                .trainingProgramId(1L)
                .dateOfBirth(LocalDate.of(2003, 5, 20))
                .gender("Nam")
                .debtCredits(0)
                .build();
    }

    @Test
    @DisplayName("Tìm kiếm sinh viên phân trang theo bộ lọc thành công")
    void getStudents_Paged_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        when(studentRepository.searchStudents(eq(100L), eq(1L), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(sampleStudent), pageable, 1));
        when(majorRepository.findById(100L)).thenReturn(Optional.of(sampleMajor));
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));

        PageResponse<StudentResponseDTO> pageResponse = studentService.getStudents(100L, 1L, "CNTT1", "2021", pageable);

        assertNotNull(pageResponse);
        assertEquals(1, pageResponse.getTotalElements());
        assertEquals(1, pageResponse.getContent().size());
        StudentResponseDTO dto = pageResponse.getContent().get(0);
        assertEquals("2021601234", dto.getStudentCode());
        assertEquals("Công nghệ thông tin", dto.getMajorName());
        assertEquals("Cử nhân", dto.getTrainingProgramName());
    }

    @Test
    @DisplayName("Lấy chi tiết sinh viên theo ID thành công")
    void getStudentById_Success() {
        when(studentRepository.findById(101L)).thenReturn(Optional.of(sampleStudent));
        when(majorRepository.findById(100L)).thenReturn(Optional.of(sampleMajor));
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));

        StudentResponseDTO dto = studentService.getStudentById(101L);

        assertNotNull(dto);
        assertEquals(101L, dto.getStudentId());
        assertEquals("2021601234", dto.getStudentCode());
    }

    @Test
    @DisplayName("Lấy chi tiết sinh viên theo UserId thành công")
    void getStudentByUserId_Success() {
        when(studentRepository.findByUserId(10L)).thenReturn(Optional.of(sampleStudent));
        when(majorRepository.findById(100L)).thenReturn(Optional.of(sampleMajor));
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));

        StudentResponseDTO dto = studentService.getStudentByUserId(10L);

        assertNotNull(dto);
        assertEquals(10L, dto.getUserId());
        assertEquals("2021601234", dto.getStudentCode());
    }

    @Test
    @DisplayName("Tạo mới sinh viên thành công")
    void createStudent_Success() {
        CreateStudentRequestDTO req = CreateStudentRequestDTO.builder()
                .username("newstudent")
                .email("newstudent@utc.edu.vn")
                .password("Password@123")
                .fullName("Trần Văn Bình")
                .phone("0988776655")
                .studentCode("2021609999")
                .className("CNTT2 - K62")
                .majorId(100L)
                .trainingProgramId(1L)
                .debtCredits(0)
                .build();

        when(userRepository.existsByUsername("newstudent")).thenReturn(false);
        when(userRepository.existsByEmail("newstudent@utc.edu.vn")).thenReturn(false);
        when(studentRepository.existsByStudentCode("2021609999")).thenReturn(false);
        when(majorRepository.existsById(100L)).thenReturn(true);
        when(trainingProgramRepository.existsById(1L)).thenReturn(true);
        when(roleRepository.findByName("ROLE_STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode("Password@123")).thenReturn("$2a$10$encodedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(11L);
            return u;
        });

        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId(102L);
            return s;
        });

        when(majorRepository.findById(100L)).thenReturn(Optional.of(sampleMajor));
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));

        StudentResponseDTO result = studentService.createStudent(req);

        assertNotNull(result);
        assertEquals(102L, result.getStudentId());
        assertEquals("2021609999", result.getStudentCode());
        verify(passwordEncoder).encode("Password@123");
    }

    @Test
    @DisplayName("Cập nhật thông tin sinh viên thành công")
    void updateStudent_Success() {
        UpdateStudentRequestDTO req = UpdateStudentRequestDTO.builder()
                .fullName("Nguyễn Văn Sinh Viên (Đã đổi)")
                .className("CNTT3 - K62")
                .debtCredits(3)
                .build();

        when(studentRepository.findById(101L)).thenReturn(Optional.of(sampleStudent));
        when(studentRepository.save(any(Student.class))).thenReturn(sampleStudent);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(majorRepository.findById(100L)).thenReturn(Optional.of(sampleMajor));
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));

        StudentResponseDTO result = studentService.updateStudent(101L, req);

        assertNotNull(result);
        assertEquals("CNTT3 - K62", sampleStudent.getClassName());
        assertEquals(3, sampleStudent.getDebtCredits());
        assertEquals("Nguyễn Văn Sinh Viên (Đã đổi)", sampleUser.getFullName());
    }
}
