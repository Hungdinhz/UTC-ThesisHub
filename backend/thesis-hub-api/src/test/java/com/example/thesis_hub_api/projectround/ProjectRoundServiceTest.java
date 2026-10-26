package com.example.thesis_hub_api.projectround;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.projectround.dto.request.CreateMilestoneRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.CreateProjectRoundRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.MilestoneResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.ProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.TimelineMilestone;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.TimelineMilestoneRepository;
import com.example.thesis_hub_api.projectround.service.ProjectRoundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.entity.LecturerDirection;
import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.assignment.repository.LecturerDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectRoundServiceTest {

    @Mock
    private ProjectRoundRepository projectRoundRepository;

    @Mock
    private TimelineMilestoneRepository timelineMilestoneRepository;

    @Mock
    private TrainingProgramRepository trainingProgramRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Mock
    private LecturerCapacityRepository lecturerCapacityRepository;

    @Mock
    private ProjectDirectionRepository projectDirectionRepository;

    @Mock
    private LecturerDirectionRepository lecturerDirectionRepository;

    @Mock
    private SupervisorAssignmentRepository supervisorAssignmentRepository;

    @Mock
    private com.example.thesis_hub_api.assignment.repository.DirectionRegistrationRepository directionRegistrationRepository;

    @Mock
    private com.example.thesis_hub_api.assignment.repository.PreferenceRepository preferenceRepository;

    @Mock
    private com.example.thesis_hub_api.thesis.repository.ProposalRepository proposalRepository;

    @Mock
    private com.example.thesis_hub_api.thesis.repository.ThesisRepository thesisRepository;

    @Mock
    private com.example.thesis_hub_api.organization.repository.StudentRepository studentRepository;

    @Mock
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @InjectMocks
    private ProjectRoundService projectRoundService;

    private TrainingProgram sampleProgram;
    private ProjectRound sampleRound;
    private TimelineMilestone milestoneActive;
    private TimelineMilestone milestoneFuture;

    @BeforeEach
    void setUp() {
        sampleProgram = TrainingProgram.builder()
                .id(1L)
                .code("CU_NHAN")
                .name("Chương trình Cử nhân")
                .durationYears(BigDecimal.valueOf(4.0))
                .totalCredits(130)
                .build();

        sampleRound = ProjectRound.builder()
                .id(10L)
                .roundCode("DA_CNTT_K62_HK1")
                .name("Đợt Đồ án Tốt nghiệp K62 CNTT - HK1 2026-2027")
                .academicYear("2026-2027")
                .semester("HK1")
                .trainingProgram(sampleProgram)
                .status("OPEN")
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusMonths(3))
                .milestones(new ArrayList<>())
                .build();

        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "studentProjectRoundRepository", studentProjectRoundRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "lecturerCapacityRepository", lecturerCapacityRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "projectDirectionRepository", projectDirectionRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "lecturerDirectionRepository", lecturerDirectionRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "supervisorAssignmentRepository", supervisorAssignmentRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "directionRegistrationRepository", directionRegistrationRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "preferenceRepository", preferenceRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "proposalRepository", proposalRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "thesisRepository", thesisRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "studentRepository", studentRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(projectRoundService, "jdbcTemplate", jdbcTemplate);

        Instant now = Instant.now();

        milestoneActive = TimelineMilestone.builder()
                .id(1L)
                .projectRound(sampleRound)
                .name("Đăng ký nguyện vọng & Hướng đề tài")
                .phaseType("REGISTRATION")
                .startDate(now.minus(2, ChronoUnit.DAYS))
                .endDate(now.plus(5, ChronoUnit.DAYS))
                .orderIndex(1)
                .build();

        milestoneFuture = TimelineMilestone.builder()
                .id(2L)
                .projectRound(sampleRound)
                .name("Nộp đề cương đồ án")
                .phaseType("PROPOSAL_SUBMISSION")
                .startDate(now.plus(6, ChronoUnit.DAYS))
                .endDate(now.plus(15, ChronoUnit.DAYS))
                .orderIndex(2)
                .build();

        sampleRound.getMilestones().add(milestoneActive);
        sampleRound.getMilestones().add(milestoneFuture);
    }

    @Test
    @DisplayName("CONTRACT 2: Tra cứu đợt đồ án đang hoạt động thành công")
    void getActiveRound_Contract2_Success() {
        when(projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("OPEN"))
                .thenReturn(Optional.of(sampleRound));

        ProjectRoundResponseDTO result = projectRoundService.getActiveRound();

        assertNotNull(result);
        assertEquals(10L, result.getRoundId());
        assertEquals("DA_CNTT_K62_HK1", result.getRoundCode());
        assertEquals("OPEN", result.getStatus());
        assertEquals("CU_NHAN", result.getTrainingProgram());
        assertEquals(2, result.getMilestones().size());

        // Kiểm tra milestoneActive phải có isActive = true
        MilestoneResponseDTO m1 = result.getMilestones().get(0);
        assertEquals("REGISTRATION", m1.getPhaseType());
        assertTrue(m1.getIsActive());

        // Kiểm tra milestoneFuture phải có isActive = false
        MilestoneResponseDTO m2 = result.getMilestones().get(1);
        assertEquals("PROPOSAL_SUBMISSION", m2.getPhaseType());
        assertFalse(m2.getIsActive());

        // Current milestone phải là m1
        assertNotNull(result.getCurrentMilestone());
        assertEquals(1L, result.getCurrentMilestone().getMilestoneId());
    }

    @Test
    @DisplayName("CONTRACT 2: Không có đợt đồ án đang mở ném lỗi PROJECT_ROUND_CLOSED")
    void getActiveRound_NoActiveRound_ThrowsException() {
        when(projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("OPEN")).thenReturn(Optional.empty());
        when(projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("IN_PROGRESS")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.getActiveRound());
        assertEquals(ErrorCode.PROJECT_ROUND_CLOSED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo mới đợt đồ án thành công")
    void createRound_Success() {
        CreateProjectRoundRequestDTO req = CreateProjectRoundRequestDTO.builder()
                .roundCode("DA_CNTT_K63_HK1")
                .name("Đợt Đồ án K63")
                .academicYear("2026-2027")
                .semester("HK1")
                .trainingProgramId(1L)
                .build();

        when(projectRoundRepository.existsByRoundCode("DA_CNTT_K63_HK1")).thenReturn(false);
        when(trainingProgramRepository.findById(1L)).thenReturn(Optional.of(sampleProgram));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenAnswer(inv -> {
            ProjectRound r = inv.getArgument(0);
            r.setId(11L);
            return r;
        });

        ProjectRoundResponseDTO result = projectRoundService.createRound(req, null);

        assertNotNull(result);
        assertEquals(11L, result.getRoundId());
        assertEquals("DA_CNTT_K63_HK1", result.getRoundCode());
        assertEquals("DRAFT", result.getStatus());
    }

    @Test
    @DisplayName("Tạo đợt trùng mã code ném lỗi DUPLICATE_RESOURCE")
    void createRound_DuplicateCode_ThrowsException() {
        CreateProjectRoundRequestDTO req = CreateProjectRoundRequestDTO.builder()
                .roundCode("DA_CNTT_K62_HK1")
                .name("Đợt Đồ án K62")
                .build();

        when(projectRoundRepository.existsByRoundCode("DA_CNTT_K62_HK1")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.createRound(req, null));
        assertEquals(ErrorCode.DUPLICATE_RESOURCE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chuyển đổi trạng thái đợt đồ án thành công")
    void updateRoundStatus_Success() {
        sampleRound.setStatus("IN_PROGRESS");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenReturn(sampleRound);

        ProjectRoundResponseDTO result = projectRoundService.updateRoundStatus(10L, "CLOSED");

        assertNotNull(result);
        assertEquals("CLOSED", sampleRound.getStatus());
    }

    @Test
    @DisplayName("Mở đợt đồ án khi số SV > chỉ tiêu ném lỗi INVALID_STATUS_TRANSITION")
    void updateRoundStatus_StudentCountExceedsCapacity_ThrowsException() {
        sampleRound.setStatus("DRAFT");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        // 10 students, 0 capacity
        when(studentProjectRoundRepository.countByProjectRoundId(10L)).thenReturn(10L);
        when(studentProjectRoundRepository.findByProjectRoundId(10L)).thenReturn(Collections.emptyList());
        when(lecturerCapacityRepository.findByProjectRoundId(10L)).thenReturn(Collections.emptyList());

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.updateRoundStatus(10L, "OPEN"));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("chỉ tiêu hướng dẫn"));
    }

    @Test
    @DisplayName("Thêm mốc thời gian ngày kết thúc trước ngày bắt đầu ném lỗi VALIDATION_FAILED")
    void addMilestone_InvalidDates_ThrowsException() {
        Instant now = Instant.now();
        CreateMilestoneRequestDTO req = CreateMilestoneRequestDTO.builder()
                .name("Mốc sai ngày")
                .phaseType("TEST")
                .startDate(now)
                .endDate(now.minus(1, ChronoUnit.DAYS))
                .build();

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.addMilestone(10L, req));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Mở đợt đồ án thất bại khi có hướng không có giảng viên nào phụ trách")
    void updateRoundStatus_MissingLecturerForDirection_ThrowsException() {
        sampleRound.setStatus("DRAFT");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        // 1 student with status ELIGIBLE
        when(studentProjectRoundRepository.countByProjectRoundId(10L)).thenReturn(1L);
        StudentProjectRound spr = StudentProjectRound.builder().status("ELIGIBLE").build();
        when(studentProjectRoundRepository.findByProjectRoundId(10L)).thenReturn(List.of(spr));

        // 1 Lecturer (id: 101L, capacity: 5)
        LecturerCapacity cap = LecturerCapacity.builder()
                .lecturerId(101L)
                .projectRoundId(10L)
                .maxQuota(5)
                .isActive(true)
                .build();
        when(lecturerCapacityRepository.findByProjectRoundId(10L)).thenReturn(List.of(cap));

        // Registration timeline milestone exists
        when(timelineMilestoneRepository.findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(10L))
                .thenReturn(List.of(milestoneActive));

        // Active directions: PM_APP (id 1) and GAME (id 2)
        ProjectDirection d1 = ProjectDirection.builder().id(1L).code("HD_PM_APP").name("Phát triển phần mềm").isActive(true).build();
        ProjectDirection d2 = ProjectDirection.builder().id(2L).code("HD_GAME").name("Lập trình Game").isActive(true).build();
        when(projectDirectionRepository.findByIsActiveTrue()).thenReturn(List.of(d1, d2));

        // Lecturer 101 only covers Dir 1 (HD_PM_APP)
        LecturerDirection ld1 = LecturerDirection.builder().lecturerId(101L).directionId(1L).build();
        when(lecturerDirectionRepository.findByLecturerIdIn(List.of(101L))).thenReturn(List.of(ld1));

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.updateRoundStatus(10L, "OPEN"));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Lập trình Game"));
        assertTrue(ex.getMessage().contains("Mỗi hướng đồ án phải có ít nhất 1 giảng viên"));
    }

    @Test
    @DisplayName("Mở đợt đồ án thành công khi tất cả các hướng đều có ít nhất 1 giảng viên phụ trách")
    void updateRoundStatus_AllDirectionsCovered_Success() {
        sampleRound.setStatus("DRAFT");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenReturn(sampleRound);

        // 1 student with status ELIGIBLE
        when(studentProjectRoundRepository.countByProjectRoundId(10L)).thenReturn(1L);
        StudentProjectRound spr = StudentProjectRound.builder().status("ELIGIBLE").build();
        when(studentProjectRoundRepository.findByProjectRoundId(10L)).thenReturn(List.of(spr));

        // 2 Lecturers (101L and 102L)
        LecturerCapacity cap1 = LecturerCapacity.builder()
                .lecturerId(101L)
                .projectRoundId(10L)
                .maxQuota(5)
                .isActive(true)
                .build();
        LecturerCapacity cap2 = LecturerCapacity.builder()
                .lecturerId(102L)
                .projectRoundId(10L)
                .maxQuota(5)
                .isActive(true)
                .build();
        when(lecturerCapacityRepository.findByProjectRoundId(10L)).thenReturn(List.of(cap1, cap2));

        // Registration timeline milestone exists
        when(timelineMilestoneRepository.findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(10L))
                .thenReturn(List.of(milestoneActive));

        // Active directions: PM_APP (id 1) and GAME (id 2)
        ProjectDirection d1 = ProjectDirection.builder().id(1L).code("HD_PM_APP").name("Phát triển phần mềm").isActive(true).build();
        ProjectDirection d2 = ProjectDirection.builder().id(2L).code("HD_GAME").name("Lập trình Game").isActive(true).build();
        when(projectDirectionRepository.findByIsActiveTrue()).thenReturn(List.of(d1, d2));

        // Lecturer 101 covers Dir 1, Lecturer 102 covers Dir 2
        LecturerDirection ld1 = LecturerDirection.builder().lecturerId(101L).directionId(1L).build();
        LecturerDirection ld2 = LecturerDirection.builder().lecturerId(102L).directionId(2L).build();
        when(lecturerDirectionRepository.findByLecturerIdIn(List.of(101L, 102L))).thenReturn(List.of(ld1, ld2));

        ProjectRoundResponseDTO result = projectRoundService.updateRoundStatus(10L, "OPEN");
        assertNotNull(result);
        assertEquals("OPEN", sampleRound.getStatus());
    }

    @Test
    @DisplayName("Demo advanceRoundPhase chuyển mốc tiếp theo và cập nhật trạng thái đợt")
    void advanceRoundPhase_Success() {
        sampleRound.setStatus("OPEN");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenReturn(sampleRound);

        TimelineMilestone m1 = TimelineMilestone.builder()
                .id(1L)
                .name("GĐ2: Đăng ký")
                .phaseType("REGISTRATION")
                .startDate(Instant.now().minus(java.time.Duration.ofDays(1)))
                .endDate(Instant.now().plus(java.time.Duration.ofDays(5)))
                .orderIndex(1)
                .build();
        TimelineMilestone m2 = TimelineMilestone.builder()
                .id(2L)
                .name("GĐ3: Nộp đề cương")
                .phaseType("PROPOSAL_SUBMISSION")
                .startDate(Instant.now().plus(java.time.Duration.ofDays(6)))
                .endDate(Instant.now().plus(java.time.Duration.ofDays(20)))
                .orderIndex(2)
                .build();

        List<TimelineMilestone> list = new ArrayList<>(List.of(m1, m2));
        when(timelineMilestoneRepository.findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(10L))
                .thenReturn(list);
        when(timelineMilestoneRepository.saveAll(any())).thenReturn(list);

        // Advance without target: moves from active m1 to next m2 (PROPOSAL_SUBMISSION)
        ProjectRoundResponseDTO response = projectRoundService.advanceRoundPhase(10L, null);
        assertNotNull(response);
        assertEquals("IN_PROGRESS", sampleRound.getStatus());
        assertTrue(m1.getEndDate().isBefore(Instant.now()));
        assertTrue(m2.getStartDate().isBefore(Instant.now()));
        assertTrue(m2.getEndDate().isAfter(Instant.now()));
    }

    @Test
    @DisplayName("Demo advanceRoundPhase: Tự động loại sinh viên chưa đăng ký nguyện vọng khi kết thúc GĐ2")
    void advanceRoundPhase_DropsUnregisteredStudents() {
        sampleRound.setStatus("OPEN");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenReturn(sampleRound);

        TimelineMilestone m1 = TimelineMilestone.builder()
                .id(1L)
                .name("GĐ2: Đăng ký")
                .phaseType("REGISTRATION")
                .startDate(Instant.now().minus(java.time.Duration.ofDays(1)))
                .endDate(Instant.now().plus(java.time.Duration.ofDays(5)))
                .orderIndex(1)
                .build();
        TimelineMilestone m2 = TimelineMilestone.builder()
                .id(2L)
                .name("GĐ3: Nộp đề cương")
                .phaseType("PROPOSAL_SUBMISSION")
                .startDate(Instant.now().plus(java.time.Duration.ofDays(6)))
                .endDate(Instant.now().plus(java.time.Duration.ofDays(20)))
                .orderIndex(2)
                .build();

        List<TimelineMilestone> list = new ArrayList<>(List.of(m1, m2));
        when(timelineMilestoneRepository.findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(10L)).thenReturn(list);
        when(timelineMilestoneRepository.saveAll(any())).thenReturn(list);

        com.example.thesis_hub_api.organization.entity.Student s1 = com.example.thesis_hub_api.organization.entity.Student.builder().id(101L).studentCode("202160001").build();
        com.example.thesis_hub_api.organization.entity.Student s2 = com.example.thesis_hub_api.organization.entity.Student.builder().id(102L).studentCode("202160002").build();
        StudentProjectRound spr1 = StudentProjectRound.builder().id(1L).student(s1).status("ELIGIBLE").build();
        StudentProjectRound spr2 = StudentProjectRound.builder().id(2L).student(s2).status("ELIGIBLE").build();
        when(studentProjectRoundRepository.findByProjectRoundId(10L)).thenReturn(List.of(spr1, spr2));

        com.example.thesis_hub_api.assignment.entity.DirectionRegistration reg1 = com.example.thesis_hub_api.assignment.entity.DirectionRegistration.builder().id(1L).studentId(101L).build();
        when(directionRegistrationRepository.findByProjectRoundId(10L)).thenReturn(List.of(reg1));
        when(preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(10L)).thenReturn(Collections.emptyList());
        when(supervisorAssignmentRepository.findByProjectRoundId(10L)).thenReturn(Collections.emptyList());

        // Tiến vào GĐ3 (PROPOSAL_SUBMISSION)
        projectRoundService.advanceRoundPhase(10L, "PROPOSAL_SUBMISSION");

        // Sinh viên 1 đạt và được chuyển sang ASSIGNED
        assertEquals("ASSIGNED", spr1.getStatus());
        // Sinh viên 2 không đạt và bị loại DROPPED
        assertEquals("DROPPED", spr2.getStatus());
        assertTrue(spr2.getNote().contains("Không hoàn thành GĐ2"));
    }

    @Test
    @DisplayName("deleteRound - Thành công khi đợt ở trạng thái CLOSED")
    void deleteRound_success_whenClosed() {
        sampleRound.setStatus("CLOSED");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        assertDoesNotThrow(() -> projectRoundService.deleteRound(10L));
        verify(projectRoundRepository, times(1)).delete(sampleRound);
        verify(jdbcTemplate, atLeastOnce()).update(anyString(), eq(10L));
    }

    @Test
    @DisplayName("deleteRound - Thành công khi đợt ở trạng thái ARCHIVED")
    void deleteRound_success_whenArchived() {
        sampleRound.setStatus("ARCHIVED");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        assertDoesNotThrow(() -> projectRoundService.deleteRound(10L));
        verify(projectRoundRepository, times(1)).delete(sampleRound);
    }

    @Test
    @DisplayName("deleteRound - Bị từ chối khi đợt đang mở (OPEN)")
    void deleteRound_failed_whenOpen() {
        sampleRound.setStatus("OPEN");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.deleteRound(10L));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Không thể xóa đợt đồ án đang hoạt động"));
        verify(projectRoundRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteRound - Bị từ chối khi đợt đang làm (IN_PROGRESS)")
    void deleteRound_failed_whenInProgress() {
        sampleRound.setStatus("IN_PROGRESS");
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.deleteRound(10L));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Không thể xóa đợt đồ án đang hoạt động"));
        verify(projectRoundRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteRound - Ném lỗi RESOURCE_NOT_FOUND khi không tìm thấy đợt")
    void deleteRound_failed_whenNotFound() {
        when(projectRoundRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> projectRoundService.deleteRound(999L));
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND, ex.getErrorCode());
        verify(projectRoundRepository, never()).delete(any());
    }
}
