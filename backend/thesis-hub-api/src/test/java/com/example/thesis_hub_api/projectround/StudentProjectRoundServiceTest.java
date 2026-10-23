package com.example.thesis_hub_api.projectround;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.projectround.dto.request.StudentImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateStudentRoundStatusRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.projectround.service.StudentProjectRoundService;
import com.example.thesis_hub_api.projectround.util.StudentExcelParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentProjectRoundServiceTest {

    @Mock
    private ProjectRoundRepository projectRoundRepository;

    @Mock
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private TrainingProgramRepository trainingProgramRepository;

    @Mock
    private StudentExcelParser studentExcelParser;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private StudentProjectRoundService studentProjectRoundService;

    private ProjectRound sampleRound;
    private Major sampleMajor;
    private TrainingProgram sampleProgram;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        sampleProgram = TrainingProgram.builder()
                .id(1L)
                .code("KY_SU")
                .name("Kỹ sư")
                .build();

        sampleMajor = Major.builder()
                .id(10L)
                .code("CNTT")
                .name("Công nghệ thông tin")
                .build();

        sampleRound = ProjectRound.builder()
                .id(100L)
                .roundCode("DA_CNTT_K62_HK1")
                .name("Đợt đồ án tốt nghiệp CNTT K62")
                .trainingProgram(sampleProgram)
                .status("OPEN")
                .build();

        studentRole = Role.builder()
                .id(2L)
                .name("ROLE_STUDENT")
                .description("Sinh viên")
                .build();
    }

    @Test
    @DisplayName("Preview import file Excel - Thành công phân loại dòng hợp lệ và lỗi")
    void previewImportStudents_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "danh_sach_sv.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}
        );

        StudentImportRowDTO validRow = StudentImportRowDTO.builder()
                .rowIndex(2)
                .stt(1)
                .studentCode("201200101")
                .lastName("Nguyễn Văn")
                .firstName("An")
                .fullName("Nguyễn Văn An")
                .majorCode("CNTT")
                .className("CNTT 1 - K62")
                .phone("0912345671")
                .email("201200101@lms.utc.edu.vn")
                .isValid(true)
                .errors(new ArrayList<>())
                .build();

        StudentImportRowDTO invalidRow = StudentImportRowDTO.builder()
                .rowIndex(3)
                .stt(2)
                .studentCode("201200102")
                .lastName("Trần Thị")
                .firstName("Bình")
                .fullName("Trần Thị Bình")
                .majorCode("UNKNOWN_MAJOR")
                .className("CNTT 2 - K62")
                .phone("0912345672")
                .email("201200102@lms.utc.edu.vn")
                .isValid(true)
                .errors(new ArrayList<>())
                .build();

        when(projectRoundRepository.findById(100L)).thenReturn(Optional.of(sampleRound));
        when(studentExcelParser.parseExcel(any())).thenReturn(new ArrayList<>(List.of(validRow, invalidRow)));
        when(majorRepository.findAll()).thenReturn(List.of(sampleMajor));
        when(studentRepository.findByStudentCode("201200101")).thenReturn(Optional.empty());
        when(studentRepository.findByStudentCode("201200102")).thenReturn(Optional.empty());

        StudentImportPreviewResponseDTO preview = studentProjectRoundService.previewImportStudents(100L, file);

        assertNotNull(preview);
        assertEquals(100L, preview.getRoundId());
        assertEquals("DA_CNTT_K62_HK1", preview.getRoundCode());
        assertEquals(2, preview.getTotalRows());
        assertEquals(1, preview.getValidRows());
        assertEquals(1, preview.getErrorRows());
        assertTrue(preview.getRows().get(0).isValid());
        assertFalse(preview.getRows().get(1).isValid());
        assertTrue(preview.getRows().get(1).getErrors().get(0).contains("UNKNOWN_MAJOR"));
    }

    @Test
    @DisplayName("Commit import danh sách sinh viên - Tự động tạo User, Student và ghi danh vào đợt")
    void commitImportStudents_Success() {
        StudentImportRowDTO validRow = StudentImportRowDTO.builder()
                .rowIndex(2)
                .stt(1)
                .studentCode("201200101")
                .lastName("Nguyễn Văn")
                .firstName("An")
                .fullName("Nguyễn Văn An")
                .majorCode("CNTT")
                .className("CNTT 1 - K62")
                .phone("0912345671")
                .email("201200101@lms.utc.edu.vn")
                .isValid(true)
                .build();

        StudentImportCommitRequestDTO requestDTO = StudentImportCommitRequestDTO.builder()
                .rows(List.of(validRow))
                .build();

        when(projectRoundRepository.findById(100L)).thenReturn(Optional.of(sampleRound));
        when(roleRepository.findByName("ROLE_STUDENT")).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode(any())).thenReturn("$2a$10$encodedPassword");
        when(majorRepository.findAll()).thenReturn(List.of(sampleMajor));

        when(userRepository.findByUsername("201200101")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("201200101@lms.utc.edu.vn")).thenReturn(Optional.empty());

        User createdUser = User.builder()
                .id(50L)
                .username("201200101")
                .fullName("Nguyễn Văn An")
                .email("201200101@lms.utc.edu.vn")
                .role(studentRole)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(createdUser);

        when(studentRepository.findByStudentCode("201200101")).thenReturn(Optional.empty());
        Student createdStudent = Student.builder()
                .id(70L)
                .user(createdUser)
                .studentCode("201200101")
                .className("CNTT 1 - K62")
                .majorId(10L)
                .trainingProgramId(1L)
                .build();
        when(studentRepository.save(any(Student.class))).thenReturn(createdStudent);

        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(70L, 100L))
                .thenReturn(Optional.empty());
        when(studentProjectRoundRepository.save(any(StudentProjectRound.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        StudentImportResultResponseDTO result = studentProjectRoundService.commitImportStudents(100L, requestDTO);

        assertNotNull(result);
        assertEquals(1, result.getTotalProcessed());
        assertEquals(1, result.getNewUsersCreated());
        assertEquals(1, result.getNewStudentsCreated());
        assertEquals(1, result.getEnrolledInRound());
        assertEquals(0, result.getSkipped());

        verify(userRepository, times(1)).save(any(User.class));
        verify(studentRepository, times(1)).save(any(Student.class));
        verify(studentProjectRoundRepository, times(1)).save(any(StudentProjectRound.class));
    }

    @Test
    @DisplayName("CONTRACT 3: Tra cứu danh sách sinh viên trong đợt đồ án có phân trang")
    void getStudentsInRound_Contract3_Success() {
        User user = User.builder()
                .id(1L)
                .username("201200101")
                .fullName("Nguyễn Văn An")
                .email("201200101@lms.utc.edu.vn")
                .phone("0912345671")
                .build();

        Student student = Student.builder()
                .id(10L)
                .user(user)
                .studentCode("201200101")
                .className("CNTT 1 - K62")
                .majorId(10L)
                .trainingProgramId(1L)
                .debtCredits(0)
                .build();

        StudentProjectRound spr = StudentProjectRound.builder()
                .id(1001L)
                .student(student)
                .projectRound(sampleRound)
                .status("ELIGIBLE")
                .note("Đủ điều kiện làm đồ án")
                .createdAt(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<StudentProjectRound> sprPage = new PageImpl<>(List.of(spr), pageable, 1);

        when(projectRoundRepository.existsById(100L)).thenReturn(true);
        when(studentProjectRoundRepository.searchStudentsInRound(eq(100L), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(sprPage);
        when(majorRepository.findAll()).thenReturn(List.of(sampleMajor));
        when(trainingProgramRepository.findAll()).thenReturn(List.of(sampleProgram));

        PageResponse<StudentProjectRoundResponseDTO> response = studentProjectRoundService.getStudentsInRound(
                100L, null, null, null, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());

        StudentProjectRoundResponseDTO dto = response.getContent().get(0);
        assertEquals(1001L, dto.getStudentRoundId());
        assertEquals(10L, dto.getStudentId());
        assertEquals("201200101", dto.getStudentCode());
        assertEquals("Nguyễn Văn An", dto.getFullName());
        assertEquals("201200101@lms.utc.edu.vn", dto.getEmail());
        assertEquals("0912345671", dto.getPhone());
        assertEquals("CNTT 1 - K62", dto.getClassName());
        assertEquals(10L, dto.getMajorId());
        assertEquals("CNTT", dto.getMajorCode());
        assertEquals("Công nghệ thông tin", dto.getMajorName());
        assertEquals("Kỹ sư", dto.getTrainingProgram());
        assertEquals("ELIGIBLE", dto.getStatus());
        assertEquals(0, dto.getDebtCredits());
    }

    @Test
    @DisplayName("Cập nhật trạng thái sinh viên trong đợt đồ án - Thành công")
    void updateStudentRoundStatus_Success() {
        Student student = Student.builder()
                .id(10L)
                .studentCode("201200101")
                .majorId(10L)
                .trainingProgramId(1L)
                .build();

        StudentProjectRound spr = StudentProjectRound.builder()
                .id(1001L)
                .student(student)
                .projectRound(sampleRound)
                .status("ELIGIBLE")
                .build();

        UpdateStudentRoundStatusRequestDTO requestDTO = UpdateStudentRoundStatusRequestDTO.builder()
                .status("REGISTERED")
                .note("Đã đăng ký đề tài thành công")
                .build();

        when(projectRoundRepository.findById(100L)).thenReturn(Optional.of(sampleRound));
        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(10L, 100L))
                .thenReturn(Optional.of(spr));
        when(studentProjectRoundRepository.save(any(StudentProjectRound.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(majorRepository.findAll()).thenReturn(List.of(sampleMajor));
        when(trainingProgramRepository.findAll()).thenReturn(List.of(sampleProgram));

        StudentProjectRoundResponseDTO result = studentProjectRoundService.updateStudentRoundStatus(100L, 10L, requestDTO);

        assertNotNull(result);
        assertEquals("REGISTERED", result.getStatus());
        assertEquals("Đã đăng ký đề tài thành công", result.getNote());
    }

    @Test
    @DisplayName("Tải file Excel mẫu chuẩn UTC - Trả về dữ liệu byte[] hợp lệ")
    void generateTemplate_Success() throws IOException {
        byte[] sampleBytes = new byte[]{1, 2, 3, 4};
        when(studentExcelParser.generateTemplate()).thenReturn(sampleBytes);

        byte[] result = studentProjectRoundService.generateTemplate();
        assertArrayEquals(sampleBytes, result);
    }
}
