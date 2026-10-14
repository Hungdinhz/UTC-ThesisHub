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
        when(projectRoundRepository.findById(10L)).thenReturn(Optional.of(sampleRound));
        when(projectRoundRepository.save(any(ProjectRound.class))).thenReturn(sampleRound);

        ProjectRoundResponseDTO result = projectRoundService.updateRoundStatus(10L, "IN_PROGRESS");

        assertNotNull(result);
        assertEquals("IN_PROGRESS", sampleRound.getStatus());
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
}
