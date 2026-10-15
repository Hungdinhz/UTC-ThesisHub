package com.example.thesis_hub_api.organization;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.organization.dto.request.*;
import com.example.thesis_hub_api.organization.dto.response.*;
import com.example.thesis_hub_api.organization.entity.*;
import com.example.thesis_hub_api.organization.repository.*;
import com.example.thesis_hub_api.organization.service.OrganizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private TrainingProgramRepository trainingProgramRepository;

    @InjectMocks
    private OrganizationService organizationService;

    private Faculty sampleFaculty;
    private Department sampleDepartment;
    private Major sampleMajor;
    private TrainingProgram sampleProgram;

    @BeforeEach
    void setUp() {
        sampleFaculty = Faculty.builder()
                .id(1L)
                .code("CNTT")
                .name("Công nghệ thông tin")
                .description("Khoa CNTT - ĐH GTVT")
                .build();

        sampleDepartment = Department.builder()
                .id(10L)
                .faculty(sampleFaculty)
                .code("CNPM")
                .name("Công nghệ phần mềm")
                .description("Bộ môn CNPM")
                .build();

        sampleMajor = Major.builder()
                .id(100L)
                .faculty(sampleFaculty)
                .department(sampleDepartment)
                .code("7480201")
                .name("Công nghệ thông tin")
                .build();

        sampleProgram = TrainingProgram.builder()
                .id(1L)
                .code("CU_NHAN")
                .name("Cử nhân")
                .durationYears(java.math.BigDecimal.valueOf(4.0))
                .totalCredits(130)
                .build();
    }

    // ─── FACULTY TESTS ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Lấy danh sách khoa trả về danh sách có thống kê số bộ môn")
    void getAllFaculties_ShouldReturnList() {
        when(facultyRepository.findAll()).thenReturn(List.of(sampleFaculty));
        when(departmentRepository.findByFacultyId(1L)).thenReturn(List.of(sampleDepartment));

        List<FacultyResponseDTO> result = organizationService.getAllFaculties();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CNTT", result.get(0).getCode());
        assertEquals(1, result.get(0).getDepartmentCount());
    }

    @Test
    @DisplayName("Lấy chi tiết khoa theo ID thành công")
    void getFacultyById_Success() {
        when(facultyRepository.findById(1L)).thenReturn(Optional.of(sampleFaculty));
        when(departmentRepository.findByFacultyId(1L)).thenReturn(Collections.emptyList());

        FacultyResponseDTO result = organizationService.getFacultyById(1L);

        assertNotNull(result);
        assertEquals("CNTT", result.getCode());
        assertEquals(0, result.getDepartmentCount());
    }

    @Test
    @DisplayName("Lấy chi tiết khoa không tồn tại ném AppException RESOURCE_NOT_FOUND")
    void getFacultyById_NotFound() {
        when(facultyRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> organizationService.getFacultyById(999L));
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo khoa mới thành công khi mã code chưa tồn tại")
    void createFaculty_Success() {
        FacultyRequestDTO req = FacultyRequestDTO.builder()
                .code("KT")
                .name("Kinh tế Vận tải")
                .description("Khoa Kinh tế")
                .build();

        when(facultyRepository.existsByCode("KT")).thenReturn(false);
        when(facultyRepository.save(any(Faculty.class))).thenAnswer(invocation -> {
            Faculty f = invocation.getArgument(0);
            f.setId(2L);
            return f;
        });

        FacultyResponseDTO result = organizationService.createFaculty(req);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("KT", result.getCode());
        assertEquals("Kinh tế Vận tải", result.getName());
    }

    @Test
    @DisplayName("Tạo khoa ném lỗi khi mã khoa đã tồn tại")
    void createFaculty_DuplicateCode_ThrowsException() {
        FacultyRequestDTO req = FacultyRequestDTO.builder()
                .code("CNTT")
                .name("Trùng mã")
                .build();

        when(facultyRepository.existsByCode("CNTT")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> organizationService.createFaculty(req));
        assertEquals(ErrorCode.DUPLICATE_RESOURCE, ex.getErrorCode());
    }

    // ─── DEPARTMENT TESTS ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Lấy danh sách bộ môn theo khoa thành công")
    void getDepartments_ByFacultyId() {
        when(departmentRepository.findByFacultyId(1L)).thenReturn(List.of(sampleDepartment));

        List<DepartmentResponseDTO> list = organizationService.getDepartments(1L);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("CNPM", list.get(0).getCode());
        assertEquals("Công nghệ thông tin", list.get(0).getFacultyName());
    }

    @Test
    @DisplayName("Tạo bộ môn thành công khi khoa tồn tại")
    void createDepartment_Success() {
        DepartmentRequestDTO req = DepartmentRequestDTO.builder()
                .facultyId(1L)
                .code("KHMT")
                .name("Khoa học máy tính")
                .build();

        when(departmentRepository.existsByCode("KHMT")).thenReturn(false);
        when(facultyRepository.findById(1L)).thenReturn(Optional.of(sampleFaculty));
        when(departmentRepository.save(any(Department.class))).thenAnswer(invocation -> {
            Department d = invocation.getArgument(0);
            d.setId(11L);
            return d;
        });

        DepartmentResponseDTO result = organizationService.createDepartment(req);

        assertNotNull(result);
        assertEquals("KHMT", result.getCode());
        assertEquals(1L, result.getFacultyId());
    }

    // ─── MAJOR TESTS ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Lấy danh sách ngành đào tạo thành công")
    void getMajors_Success() {
        when(majorRepository.findByDepartmentId(10L)).thenReturn(List.of(sampleMajor));

        List<MajorResponseDTO> list = organizationService.getMajors(null, 10L);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("7480201", list.get(0).getCode());
        assertEquals("Công nghệ thông tin", list.get(0).getName());
    }

    // ─── TRAINING PROGRAM TESTS ────────────────────────────────────────────────

    @Test
    @DisplayName("Lấy danh sách chương trình đào tạo thành công")
    void getAllTrainingPrograms_Success() {
        when(trainingProgramRepository.findAll()).thenReturn(List.of(sampleProgram));

        List<TrainingProgramResponseDTO> list = organizationService.getAllTrainingPrograms();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("CU_NHAN", list.get(0).getCode());
        assertEquals(130, list.get(0).getTotalCredits());
    }
}
