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
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.entity.LecturerDirection;
import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import com.example.thesis_hub_api.assignment.repository.LecturerDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.ProjectDirectionRepository;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    @Autowired(required = false)
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Autowired(required = false)
    private LecturerCapacityRepository lecturerCapacityRepository;

    @Autowired(required = false)
    private SupervisorAssignmentRepository supervisorAssignmentRepository;

    @Autowired(required = false)
    private ProjectDirectionRepository projectDirectionRepository;

    @Autowired(required = false)
    private LecturerDirectionRepository lecturerDirectionRepository;

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

        String currentStatus = round.getStatus() != null ? round.getStatus().toUpperCase() : "DRAFT";

        // 1. Chuyển từ DRAFT -> OPEN
        if ("DRAFT".equalsIgnoreCase(currentStatus) && "OPEN".equalsIgnoreCase(cleanStatus)) {
            validateTransitionToOpen(round);
        }

        // 2. Chuyển từ OPEN -> IN_PROGRESS
        if ("OPEN".equalsIgnoreCase(currentStatus) && "IN_PROGRESS".equalsIgnoreCase(cleanStatus)) {
            validateTransitionToInProgress(round);
        }

        round.setStatus(cleanStatus);
        round = projectRoundRepository.save(round);
        return toResponseDTO(round);
    }

    private void validateTransitionToOpen(ProjectRound round) {
        List<String> errors = new ArrayList<>();
        Long roundId = round.getId();

        long studentCount = 0;
        // 1. Đợt đồ án phải có ít nhất 1 sinh viên & có sinh viên đủ điều kiện nhận đồ án (trạng thái ELIGIBLE)
        if (studentProjectRoundRepository != null) {
            studentCount = studentProjectRoundRepository.countByProjectRoundId(roundId);
            if (studentCount < 1) {
                errors.add("Đợt đồ án phải có ít nhất 1 sinh viên (hiện tại chưa có sinh viên nào).");
            } else {
                boolean hasEligibleStudent = studentProjectRoundRepository.findByProjectRoundId(roundId).stream()
                        .anyMatch(spr -> "ELIGIBLE".equalsIgnoreCase(spr.getStatus()));
                if (!hasEligibleStudent) {
                    errors.add("Chưa có sinh viên nào đủ điều kiện nhận đồ án (cần ít nhất 1 sinh viên trạng thái ELIGIBLE).");
                }
            }
        }

        // 2. Đợt đồ án phải có ít nhất 1 giảng viên tham gia và tổng chỉ tiêu hướng dẫn
        int totalCapacity = 0;
        List<Long> participatingLecturerIds = new ArrayList<>();
        if (lecturerCapacityRepository != null) {
            List<LecturerCapacity> capacities = lecturerCapacityRepository.findByProjectRoundId(roundId);
            long lecturerCount = capacities.size();
            if (lecturerCount < 1) {
                errors.add("Đợt đồ án phải có ít nhất 1 giảng viên tham gia (hiện tại chưa có giảng viên nào).");
            } else {
                totalCapacity = capacities.stream()
                        .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
                        .mapToInt(LecturerCapacity::getEffectiveCapacity)
                        .sum();

                participatingLecturerIds = capacities.stream()
                        .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
                        .map(LecturerCapacity::getLecturerId)
                        .distinct()
                        .collect(Collectors.toList());
            }
        }

        // 3. Đợt đồ án từ trạng thái nháp sang mở thì phải thỏa mãn điều kiện số sinh viên <= chỉ tiêu hướng dẫn.
        if (studentCount > totalCapacity) {
            errors.add(String.format("Số lượng sinh viên trong đợt (%d SV) vượt quá tổng chỉ tiêu hướng dẫn của giảng viên (%d SV). Điều kiện mở đợt: số sinh viên <= chỉ tiêu hướng dẫn.", studentCount, totalCapacity));
        }

        // 4. Đã thiết lập mốc timeline "Đăng ký nguyện vọng & Hướng đề tài" (REGISTRATION)
        List<TimelineMilestone> milestones = timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId);
        boolean hasRegistrationMilestone = milestones != null && milestones.stream().anyMatch(m ->
                "REGISTRATION".equalsIgnoreCase(m.getPhaseType()) ||
                (m.getName() != null && (m.getName().toLowerCase().contains("nguyện vọng") || m.getName().toLowerCase().contains("hướng đề tài") || m.getName().toLowerCase().contains("đăng ký")))
        );
        if (!hasRegistrationMilestone) {
            errors.add("Chưa thiết lập mốc timeline 'Đăng ký nguyện vọng & Hướng đề tài' (REGISTRATION).");
        }

        // 5. Mỗi hướng đồ án (ProjectDirection) đang hoạt động phải có ít nhất 1 giảng viên trong đợt đảm nhận
        if (projectDirectionRepository != null && lecturerDirectionRepository != null) {
            List<ProjectDirection> activeDirections = projectDirectionRepository.findByIsActiveTrue();
            if (activeDirections != null && !activeDirections.isEmpty()) {
                final Set<Long> coveredDirectionIds = participatingLecturerIds.isEmpty()
                        ? Collections.emptySet()
                        : lecturerDirectionRepository.findByLecturerIdIn(participatingLecturerIds).stream()
                                .map(LecturerDirection::getDirectionId)
                                .collect(Collectors.toSet());

                List<ProjectDirection> uncoveredDirections = activeDirections.stream()
                        .filter(d -> !coveredDirectionIds.contains(d.getId()))
                        .collect(Collectors.toList());

                if (!uncoveredDirections.isEmpty()) {
                    String missingNames = uncoveredDirections.stream()
                            .map(ProjectDirection::getName)
                            .collect(Collectors.joining(", "));
                    errors.add(String.format("Mỗi hướng đồ án phải có ít nhất 1 giảng viên đảm nhận trong đợt (tránh trường hợp sinh viên đăng ký hướng nhưng không có GV hướng dẫn). Hiện chưa có giảng viên nào phụ trách các hướng: %s.", missingNames));
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Không thể mở đợt đồ án do chưa thỏa mãn các điều kiện:\n• " + String.join("\n• ", errors));
        }
    }

    private void validateTransitionToInProgress(ProjectRound round) {
        List<String> errors = new ArrayList<>();
        Long roundId = round.getId();

        // 1. Đã chốt phân công giảng viên hướng dẫn (FINALIZED)
        if (supervisorAssignmentRepository != null) {
            long finalizedCount = supervisorAssignmentRepository.countByProjectRoundIdAndStatus(roundId, "FINALIZED");
            if (finalizedCount < 1) {
                long totalAssignments = supervisorAssignmentRepository.findByProjectRoundId(roundId).size();
                if (totalAssignments == 0) {
                    errors.add("Chưa có danh sách phân công giảng viên hướng dẫn.");
                } else {
                    errors.add("Danh sách phân công GVHD chưa được chốt chính thức (FINALIZED). Hãy thực hiện 'Chốt phân công' trước.");
                }
            }
        }

        // 2. Đã thiết lập các mốc timeline bắt buộc:
        // - Nộp đề cương đồ án tốt nghiệp PROPOSAL_SUBMISSION
        // - Thực hiện đồ án & Báo cáo tiến độ tuần WEEKLY_REPORT
        // - Xét điều kiện bảo vệ đồ án tốt nghiệp ELIGIBILITY_REVIEW
        // - Thành lập và phân công Hội đồng chấm bảo vệ COMMITTEE_ASSIGNMENT
        // - Bảo vệ đồ án tốt nghiệp trước Hội đồng DEFENSE
        List<TimelineMilestone> milestones = timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId);
        Set<String> phaseTypes = milestones.stream()
                .map(m -> m.getPhaseType() != null ? m.getPhaseType().toUpperCase() : "")
                .collect(Collectors.toSet());

        List<String> missingMilestones = new ArrayList<>();
        if (!phaseTypes.contains("PROPOSAL_SUBMISSION")) {
            missingMilestones.add("Nộp đề cương đồ án tốt nghiệp (PROPOSAL_SUBMISSION)");
        }
        if (!phaseTypes.contains("WEEKLY_REPORT")) {
            missingMilestones.add("Thực hiện đồ án & Báo cáo tiến độ tuần (WEEKLY_REPORT)");
        }
        if (!phaseTypes.contains("ELIGIBILITY_REVIEW")) {
            missingMilestones.add("Xét điều kiện bảo vệ đồ án tốt nghiệp (ELIGIBILITY_REVIEW)");
        }
        if (!phaseTypes.contains("COMMITTEE_ASSIGNMENT")) {
            missingMilestones.add("Thành lập và phân công Hội đồng chấm bảo vệ (COMMITTEE_ASSIGNMENT)");
        }
        if (!phaseTypes.contains("DEFENSE")) {
            missingMilestones.add("Bảo vệ đồ án tốt nghiệp trước Hội đồng (DEFENSE)");
        }

        if (!missingMilestones.isEmpty()) {
            errors.add("Thiếu các mốc timeline nghiệp vụ bắt buộc:\n  - " + String.join("\n  - ", missingMilestones));
        }

        if (!errors.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Không thể chuyển sang trạng thái đang làm do chưa thỏa mãn:\n• " + String.join("\n• ", errors));
        }
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
