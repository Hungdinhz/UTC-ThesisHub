package com.example.thesis_hub_api.projectround;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.organization.entity.Major;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.MajorRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.dto.request.AcademicRecordImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportRowDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordResponseDTO;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.projectround.service.AcademicRecordService;
import com.example.thesis_hub_api.projectround.util.AcademicRecordExcelParser;
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
class AcademicRecordServiceTest {

    @Mock
    private AcademicRecordRepository academicRecordRepository;

    @Mock
    private ProjectRoundRepository projectRoundRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private AcademicRecordExcelParser academicRecordExcelParser;

    @InjectMocks
    private AcademicRecordService academicRecordService;

    private ProjectRound sampleRound;
    private Student sampleStudent;
    private Major sampleMajor;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleMajor = Major.builder()
                .id(10L)
                .code("CNTT")
                .name("Công nghệ thông tin")
                .build();

        sampleUser = User.builder()
                .id(1L)
                .username("201200101")
                .fullName("Nguyễn Văn An")
                .email("201200101@lms.utc.edu.vn")
                .build();

        sampleStudent = Student.builder()
                .id(100L)
                .user(sampleUser)
                .studentCode("201200101")
                .className("CNTT 1 - K62")
                .majorId(10L)
                .build();

        sampleRound = ProjectRound.builder()
                .id(1L)
                .roundCode("DA_CNTT_K62_HK1")
                .name("Đợt đồ án K62")
                .status("OPEN")
                .build();
    }

    @Test
    @DisplayName("Preview import học vụ - Phân tích hợp lệ và cảnh báo sinh viên chưa có trong đợt")
    void previewImport_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "hoc_vu.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}
        );

        AcademicRecordImportRowDTO row1 = AcademicRecordImportRowDTO.builder()
                .rowIndex(2)
                .stt(1)
                .studentCode("201200101")
                .fullName("Nguyễn Văn An")
                .completedCredits(125)
                .gpa(3.25)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .isValid(true)
                .errors(new ArrayList<>())
                .build();

        when(projectRoundRepository.findById(1L)).thenReturn(Optional.of(sampleRound));
        when(academicRecordExcelParser.parseExcel(any())).thenReturn(new ArrayList<>(List.of(row1)));
        when(studentRepository.findByStudentCode("201200101")).thenReturn(Optional.of(sampleStudent));
        when(studentProjectRoundRepository.existsByStudentIdAndProjectRoundId(100L, 1L)).thenReturn(true);

        AcademicRecordImportPreviewResponseDTO preview = academicRecordService.previewImport(1L, file);

        assertNotNull(preview);
        assertEquals(1, preview.getTotalRows());
        assertEquals(1, preview.getValidRows());
        assertEquals(0, preview.getErrorRows());
        assertTrue(preview.getRows().get(0).isValid());
    }

    @Test
    @DisplayName("Commit import học vụ - Lưu mới AcademicRecord vào CSDL")
    void commitImport_Success() {
        AcademicRecordImportRowDTO row1 = AcademicRecordImportRowDTO.builder()
                .rowIndex(2)
                .stt(1)
                .studentCode("201200101")
                .fullName("Nguyễn Văn An")
                .completedCredits(125)
                .gpa(3.25)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .note("Đủ điều kiện")
                .isValid(true)
                .build();

        AcademicRecordImportCommitRequestDTO requestDTO = AcademicRecordImportCommitRequestDTO.builder()
                .rows(List.of(row1))
                .build();

        when(projectRoundRepository.findById(1L)).thenReturn(Optional.of(sampleRound));
        when(studentRepository.findByStudentCode("201200101")).thenReturn(Optional.of(sampleStudent));
        when(academicRecordRepository.findByStudentIdAndProjectRoundId(100L, 1L)).thenReturn(Optional.empty());

        AcademicRecordImportResultResponseDTO result = academicRecordService.commitImport(1L, requestDTO);

        assertNotNull(result);
        assertEquals(1, result.getTotalProcessed());
        assertEquals(1, result.getRecordsCreated());
        assertEquals(0, result.getRecordsUpdated());
        assertEquals(0, result.getSkipped());

        verify(academicRecordRepository, times(1)).save(any(AcademicRecord.class));
    }

    @Test
    @DisplayName("CONTRACT 4: Tra cứu kết quả học vụ của sinh viên phục vụ xét điều kiện")
    void getStudentAcademicRecord_Contract4_Success() {
        AcademicRecord record = AcademicRecord.builder()
                .id(50L)
                .student(sampleStudent)
                .projectRound(sampleRound)
                .completedCredits(125)
                .gpa(3.25)
                .tuitionDebt(false)
                .underDisciplinaryAction(false)
                .missingPrerequisiteCount(0)
                .note("Đủ điều kiện")
                .importedAt(Instant.now())
                .build();

        when(academicRecordRepository.findByStudentIdAndProjectRoundId(100L, 1L))
                .thenReturn(Optional.of(record));
        when(majorRepository.findAll()).thenReturn(List.of(sampleMajor));

        AcademicRecordResponseDTO response = academicRecordService.getStudentAcademicRecord(1L, 100L);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals(100L, response.getStudentId());
        assertEquals("201200101", response.getStudentCode());
        assertEquals("Nguyễn Văn An", response.getFullName());
        assertEquals("CNTT 1 - K62", response.getClassName());
        assertEquals("Công nghệ thông tin", response.getMajorName());
        assertEquals(125, response.getCompletedCredits());
        assertEquals(3.25, response.getGpa(), 0.001);
        assertFalse(response.getTuitionDebt());
        assertFalse(response.getUnderDisciplinaryAction());
        assertEquals(0, response.getMissingPrerequisiteCount());
    }

    @Test
    @DisplayName("Tải file Excel mẫu học vụ chuẩn UTC")
    void generateTemplate_Success() throws IOException {
        byte[] sampleBytes = new byte[]{1, 2, 3};
        when(academicRecordExcelParser.generateTemplate()).thenReturn(sampleBytes);

        byte[] result = academicRecordService.generateTemplate();
        assertArrayEquals(sampleBytes, result);
    }
}
