package com.example.thesis_hub_api.projectround.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import com.example.thesis_hub_api.organization.repository.TrainingProgramRepository;
import com.example.thesis_hub_api.projectround.dto.request.CreateMilestoneRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.CreateProjectRoundRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateMilestoneRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateProjectRoundRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.MilestoneResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.ProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.TimelineMilestone;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.TimelineMilestoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectRoundService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "DRAFT", "OPEN", "IN_PROGRESS", "CLOSED", "ARCHIVED"
    );

    private final ProjectRoundRepository projectRoundRepository;
    private final TimelineMilestoneRepository timelineMilestoneRepository;
    private final TrainingProgramRepository trainingProgramRepository;
    private final UserRepository userRepository;

    /**
     * CONTRACT 2: API Tra cứu Đợt đồ án đang hoạt động & Mốc thời gian (Timeline).
     * Cung cấp cho cả 3 thành viên kiểm tra hạn đăng ký, nộp đề cương, bảo lưu, bảo vệ.
     */
    @Transactional(readOnly = true)
    public ProjectRoundResponseDTO getActiveRound() {
        ProjectRound round = projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("OPEN")
                .or(() -> projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("IN_PROGRESS"))
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_ROUND_CLOSED));

        return toResponseDTO(round);
    }

    @Transactional(readOnly = true)
    public List<ProjectRoundResponseDTO> getRounds(String status, String academicYear) {
        String cleanStatus = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
        String cleanYear = StringUtils.hasText(academicYear) ? academicYear.trim() : null;

        List<ProjectRound> list = projectRoundRepository.findRoundsFiltered(cleanStatus, cleanYear);
        return list.stream().map(this::toResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectRoundResponseDTO> searchRoundsPaged(String status, String academicYear, Pageable pageable) {
        String cleanStatus = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
        String cleanYear = StringUtils.hasText(academicYear) ? academicYear.trim() : null;

        Page<ProjectRound> page = projectRoundRepository.searchRounds(cleanStatus, cleanYear, pageable);
        List<ProjectRoundResponseDTO> content = page.getContent().stream().map(this::toResponseDTO).toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public ProjectRoundResponseDTO getRoundById(Long id) {
        ProjectRound round = projectRoundRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return toResponseDTO(round);
    }

    @Transactional
    public ProjectRoundResponseDTO createRound(CreateProjectRoundRequestDTO dto, Long userId) {
        String cleanCode = dto.getRoundCode().trim().toUpperCase();
        if (projectRoundRepository.existsByRoundCode(cleanCode)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }

        TrainingProgram program = trainingProgramRepository.findById(dto.getTrainingProgramId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;

        ProjectRound round = ProjectRound.builder()
                .roundCode(cleanCode)
                .name(dto.getName().trim())
                .academicYear(dto.getAcademicYear().trim())
                .semester(dto.getSemester().trim())
                .trainingProgram(program)
                .status("DRAFT")
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .description(dto.getDescription())
                .createdBy(user)
                .build();

        round = projectRoundRepository.save(round);
        return toResponseDTO(round);
    }

    @Transactional
    public ProjectRoundResponseDTO updateRound(Long id, UpdateProjectRoundRequestDTO dto) {
        ProjectRound round = projectRoundRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (StringUtils.hasText(dto.getName())) {
            round.setName(dto.getName().trim());
        }
        if (StringUtils.hasText(dto.getAcademicYear())) {
            round.setAcademicYear(dto.getAcademicYear().trim());
        }
        if (StringUtils.hasText(dto.getSemester())) {
            round.setSemester(dto.getSemester().trim());
        }
        if (dto.getTrainingProgramId() != null) {
            TrainingProgram program = trainingProgramRepository.findById(dto.getTrainingProgramId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            round.setTrainingProgram(program);
        }
        if (dto.getStartDate() != null) {
            round.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            round.setEndDate(dto.getEndDate());
        }
        if (dto.getDescription() != null) {
            round.setDescription(dto.getDescription().trim());
        }

        round = projectRoundRepository.save(round);
        return toResponseDTO(round);
    }

    @Transactional
    public ProjectRoundResponseDTO updateRoundStatus(Long id, String newStatus) {
        if (!StringUtils.hasText(newStatus)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        String cleanStatus = newStatus.trim().toUpperCase();
        if (!VALID_STATUSES.contains(cleanStatus)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        ProjectRound round = projectRoundRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        round.setStatus(cleanStatus);
        round = projectRoundRepository.save(round);
        return toResponseDTO(round);
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponseDTO> getMilestonesByRoundId(Long roundId) {
        if (!projectRoundRepository.existsById(roundId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        List<TimelineMilestone> list = timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId);

        Instant now = Instant.now();
        return list.stream().map(m -> toMilestoneDTO(m, now)).toList();
    }

    @Transactional(readOnly = true)
    public MilestoneResponseDTO getCurrentMilestone(Long roundId) {
        List<TimelineMilestone> list = timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId);

        Instant now = Instant.now();
        return list.stream()
                .filter(m -> !now.isBefore(m.getStartDate()) && !now.isAfter(m.getEndDate()))
                .findFirst()
                .map(m -> toMilestoneDTO(m, now))
                .orElse(null);
    }

    @Transactional
    public MilestoneResponseDTO addMilestone(Long roundId, CreateMilestoneRequestDTO dto) {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        TimelineMilestone milestone = TimelineMilestone.builder()
                .projectRound(round)
                .name(dto.getName().trim())
                .phaseType(dto.getPhaseType().trim().toUpperCase())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .description(dto.getDescription())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        milestone = timelineMilestoneRepository.save(milestone);
        return toMilestoneDTO(milestone, Instant.now());
    }

    @Transactional
    public MilestoneResponseDTO updateMilestone(Long milestoneId, UpdateMilestoneRequestDTO dto) {
        TimelineMilestone milestone = timelineMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        Instant start = (dto.getStartDate() != null) ? dto.getStartDate() : milestone.getStartDate();
        Instant end = (dto.getEndDate() != null) ? dto.getEndDate() : milestone.getEndDate();

        if (end.isBefore(start)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        if (StringUtils.hasText(dto.getName())) {
            milestone.setName(dto.getName().trim());
        }
        if (StringUtils.hasText(dto.getPhaseType())) {
            milestone.setPhaseType(dto.getPhaseType().trim().toUpperCase());
        }
        milestone.setStartDate(start);
        milestone.setEndDate(end);

        if (dto.getDescription() != null) {
            milestone.setDescription(dto.getDescription().trim());
        }
        if (dto.getOrderIndex() != null) {
            milestone.setOrderIndex(dto.getOrderIndex());
        }

        milestone = timelineMilestoneRepository.save(milestone);
        return toMilestoneDTO(milestone, Instant.now());
    }

    @Transactional
    public void deleteMilestone(Long milestoneId) {
        if (!timelineMilestoneRepository.existsById(milestoneId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        timelineMilestoneRepository.deleteById(milestoneId);
    }

    // ─── MAPPER HELPERS ────────────────────────────────────────────────────────
    private ProjectRoundResponseDTO toResponseDTO(ProjectRound round) {
        Instant now = Instant.now();
        List<TimelineMilestone> rawMilestones = (round.getMilestones() != null) ? round.getMilestones() : List.of();

        List<MilestoneResponseDTO> milestoneDTOs = rawMilestones.stream()
                .sorted(Comparator.comparing(TimelineMilestone::getOrderIndex)
                        .thenComparing(TimelineMilestone::getStartDate))
                .map(m -> toMilestoneDTO(m, now))
                .toList();

        MilestoneResponseDTO currentMilestone = milestoneDTOs.stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .findFirst()
                .orElse(null);

        TrainingProgram tp = round.getTrainingProgram();

        return ProjectRoundResponseDTO.builder()
                .roundId(round.getId())
                .roundCode(round.getRoundCode())
                .name(round.getName())
                .academicYear(round.getAcademicYear())
                .semester(round.getSemester())
                .trainingProgramId(tp != null ? tp.getId() : null)
                .trainingProgram(tp != null ? tp.getCode() : null)
                .trainingProgramName(tp != null ? tp.getName() : null)
                .status(round.getStatus())
                .startDate(round.getStartDate())
                .endDate(round.getEndDate())
                .description(round.getDescription())
                .milestones(milestoneDTOs)
                .currentMilestone(currentMilestone)
                .createdAt(round.getCreatedAt())
                .updatedAt(round.getUpdatedAt())
                .build();
    }

    private MilestoneResponseDTO toMilestoneDTO(TimelineMilestone milestone, Instant now) {
        boolean isActive = !now.isBefore(milestone.getStartDate()) && !now.isAfter(milestone.getEndDate());

        return MilestoneResponseDTO.builder()
                .milestoneId(milestone.getId())
                .roundId(milestone.getProjectRound() != null ? milestone.getProjectRound().getId() : null)
                .name(milestone.getName())
                .phaseType(milestone.getPhaseType())
                .startDate(milestone.getStartDate())
                .endDate(milestone.getEndDate())
                .description(milestone.getDescription())
                .orderIndex(milestone.getOrderIndex())
                .isActive(isActive)
                .build();
    }
}
