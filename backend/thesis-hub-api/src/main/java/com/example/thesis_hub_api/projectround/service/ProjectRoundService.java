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
import com.example.thesis_hub_api.assignment.repository.DirectionRegistrationRepository;
import com.example.thesis_hub_api.assignment.repository.PreferenceRepository;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.projectround.dto.response.StudentRoundStatusResponseDTO;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
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

    @Autowired(required = false)
    private DirectionRegistrationRepository directionRegistrationRepository;

    @Autowired(required = false)
    private PreferenceRepository preferenceRepository;

    @Autowired(required = false)
    private ProposalRepository proposalRepository;

    @Autowired(required = false)
    private ThesisRepository thesisRepository;

    @Autowired(required = false)
    private StudentRepository studentRepository;

    @Autowired(required = false)
    private com.example.thesis_hub_api.organization.repository.LecturerRepository lecturerRepository;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

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
        return getRounds(status, academicYear, null);
    }

    @Transactional(readOnly = true)
    public List<ProjectRoundResponseDTO> getRounds(String status, String academicYear, UserPrincipal currentUser) {
        String cleanStatus = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
        String cleanYear = StringUtils.hasText(academicYear) ? academicYear.trim() : null;

        List<ProjectRound> list = projectRoundRepository.findRoundsFiltered(cleanStatus, cleanYear);

        if (currentUser != null && currentUser.getAuthorities() != null) {
            boolean isAdmin = currentUser.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equalsIgnoreCase(a.getAuthority()) || "ROLE_COMMITTEE".equalsIgnoreCase(a.getAuthority()));
            if (!isAdmin) {
                boolean isStudent = currentUser.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_STUDENT".equalsIgnoreCase(a.getAuthority()));
                boolean isLecturer = currentUser.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_LECTURER".equalsIgnoreCase(a.getAuthority()));

                if (isStudent && studentRepository != null && studentProjectRoundRepository != null) {
                    Student student = studentRepository.findByUserId(currentUser.getId()).orElse(null);
                    if (student != null) {
                        Set<Long> studentRoundIds = studentProjectRoundRepository.findByStudentId(student.getId()).stream()
                                .filter(spr -> spr.getProjectRound() != null && !"RESERVED".equalsIgnoreCase(spr.getStatus()))
                                .map(spr -> spr.getProjectRound().getId())
                                .collect(Collectors.toSet());
                        list = list.stream()
                                .filter(r -> studentRoundIds.contains(r.getId()))
                                .toList();
                    } else {
                        list = List.of();
                    }
                } else if (isLecturer && lecturerRepository != null) {
                    com.example.thesis_hub_api.organization.entity.Lecturer lecturer =
                            lecturerRepository.findByUserId(currentUser.getId()).orElse(null);
                    if (lecturer != null) {
                        Long lecId = lecturer.getId();
                        Set<Long> assignedRoundIds = new java.util.HashSet<>();
                        if (supervisorAssignmentRepository != null) {
                            supervisorAssignmentRepository.findByLecturerId(lecId).forEach(sa -> {
                                if (sa.getProjectRoundId() != null) assignedRoundIds.add(sa.getProjectRoundId());
                            });
                        }
                        if (proposalRepository != null) {
                            proposalRepository.findByLecturerId(lecId).forEach(p -> {
                                if (p.getProjectRound() != null && p.getProjectRound().getId() != null) {
                                    assignedRoundIds.add(p.getProjectRound().getId());
                                }
                            });
                        }
                        if (thesisRepository != null) {
                            thesisRepository.findByLecturerId(lecId).forEach(t -> {
                                if (t.getProjectRound() != null && t.getProjectRound().getId() != null) {
                                    assignedRoundIds.add(t.getProjectRound().getId());
                                }
                            });
                        }
                        if (lecturerCapacityRepository != null) {
                            lecturerCapacityRepository.findByLecturerId(lecId).forEach(cap -> {
                                if (cap.getProjectRoundId() != null && cap.getCurrentAssigned() != null && cap.getCurrentAssigned() > 0) {
                                    assignedRoundIds.add(cap.getProjectRoundId());
                                }
                            });
                            // Fallback nếu GV chưa có SV nào được chốt nhưng có trong danh sách giảng viên tham gia đợt đang mở
                            if (assignedRoundIds.isEmpty()) {
                                lecturerCapacityRepository.findByLecturerId(lecId).forEach(cap -> {
                                    if (cap.getProjectRoundId() != null && !Boolean.FALSE.equals(cap.getIsActive())) {
                                        assignedRoundIds.add(cap.getProjectRoundId());
                                    }
                                });
                            }
                        }
                        list = list.stream()
                                .filter(r -> assignedRoundIds.contains(r.getId()) && !"DRAFT".equalsIgnoreCase(r.getStatus()))
                                .toList();
                    } else {
                        list = List.of();
                    }
                }
            }
        }

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

    /**
     * DEMO API: Kết thúc giai đoạn hiện tại và chuyển sang giai đoạn tiếp theo (hoặc giai đoạn chỉ định).
     * Điều chỉnh các mốc thời gian trong timeline_milestones để mốc đích trở thành ACTIVE (đang làm),
     * các mốc trước đó thành COMPLETED (quá khứ), và các mốc sau thành LOCKED (tương lai).
     */
    @Transactional
    public ProjectRoundResponseDTO advanceRoundPhase(Long roundId, String targetPhaseType) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        List<TimelineMilestone> milestones = new ArrayList<>(timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId));

        Set<String> existingPhases = milestones.stream()
                .map(m -> m.getPhaseType() != null ? m.getPhaseType().toUpperCase() : "")
                .collect(Collectors.toSet());

        Instant baseNow = Instant.now();
        boolean added = false;
        if (!existingPhases.contains("REGISTRATION")) {
            milestones.add(TimelineMilestone.builder()
                    .projectRound(round)
                    .name("GĐ2: Đăng ký nguyện vọng & Hướng đề tài")
                    .phaseType("REGISTRATION")
                    .startDate(baseNow.minus(Duration.ofDays(1)))
                    .endDate(baseNow.plus(Duration.ofDays(7)))
                    .description("Sinh viên đăng ký nguyện vọng và hướng đề tài")
                    .orderIndex(1)
                    .build());
            added = true;
        }
        if (!existingPhases.contains("PROPOSAL_SUBMISSION")) {
            milestones.add(TimelineMilestone.builder()
                    .projectRound(round)
                    .name("GĐ3: Nộp đề cương đồ án tốt nghiệp")
                    .phaseType("PROPOSAL_SUBMISSION")
                    .startDate(baseNow.plus(Duration.ofDays(8)))
                    .endDate(baseNow.plus(Duration.ofDays(20)))
                    .description("Sinh viên hoàn thiện đề cương và nộp phê duyệt")
                    .orderIndex(2)
                    .build());
            added = true;
        }
        if (!existingPhases.contains("WEEKLY_REPORT")) {
            milestones.add(TimelineMilestone.builder()
                    .projectRound(round)
                    .name("GĐ4: Thực hiện đồ án & Báo cáo tiến độ tuần")
                    .phaseType("WEEKLY_REPORT")
                    .startDate(baseNow.plus(Duration.ofDays(21)))
                    .endDate(baseNow.plus(Duration.ofDays(60)))
                    .description("Sinh viên làm việc với GVHD và báo cáo tiến độ tuần")
                    .orderIndex(3)
                    .build());
            added = true;
        }
        if (!existingPhases.contains("DEFENSE") && !existingPhases.contains("ELIGIBILITY_REVIEW")) {
            milestones.add(TimelineMilestone.builder()
                    .projectRound(round)
                    .name("GĐ5: Bảo vệ đồ án tốt nghiệp trước Hội đồng")
                    .phaseType("DEFENSE")
                    .startDate(baseNow.plus(Duration.ofDays(61)))
                    .endDate(baseNow.plus(Duration.ofDays(80)))
                    .description("Bảo vệ trước hội đồng và chấm điểm biên bản")
                    .orderIndex(5)
                    .build());
            added = true;
        }
        if (added) {
            milestones = new ArrayList<>(timelineMilestoneRepository.saveAll(milestones));
            milestones.sort(Comparator.comparing(TimelineMilestone::getOrderIndex)
                    .thenComparing(TimelineMilestone::getStartDate));
        }

        Instant now = Instant.now();

        // Xác định mốc mục tiêu
        int targetIndex = 0;
        if (StringUtils.hasText(targetPhaseType)) {
            String target = targetPhaseType.trim().toUpperCase();
            boolean found = false;
            for (int i = 0; i < milestones.size(); i++) {
                TimelineMilestone m = milestones.get(i);
                if (m.getPhaseType() != null && m.getPhaseType().equalsIgnoreCase(target)) {
                    targetIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (target.contains("1") || target.contains("DRAFT")) {
                    targetIndex = 0;
                } else if (target.contains("2") || target.contains("REG")) {
                    targetIndex = findMilestoneIndex(milestones, "REGISTRATION", 0);
                } else if (target.contains("3") || target.contains("PROP")) {
                    targetIndex = findMilestoneIndex(milestones, "PROPOSAL_SUBMISSION", 1);
                } else if (target.contains("4") || target.contains("TASK") || target.contains("WEEK")) {
                    targetIndex = findMilestoneIndex(milestones, "WEEKLY_REPORT", 2);
                } else if (target.contains("5") || target.contains("DEFENSE") || target.contains("ELIG")) {
                    targetIndex = findMilestoneIndex(milestones, "DEFENSE", milestones.size() - 1);
                }
            }
        } else {
            // Tự động tìm mốc đang active và chuyển sang mốc kế tiếp
            int currentActiveIndex = -1;
            for (int i = 0; i < milestones.size(); i++) {
                TimelineMilestone m = milestones.get(i);
                if (!now.isBefore(m.getStartDate()) && !now.isAfter(m.getEndDate())) {
                    currentActiveIndex = i;
                    break;
                }
            }
            if (currentActiveIndex >= 0) {
                targetIndex = (currentActiveIndex + 1 < milestones.size()) ? currentActiveIndex + 1 : currentActiveIndex;
            } else {
                targetIndex = 0;
            }
        }

        // Cập nhật lại ngày bắt đầu/kết thúc cho toàn bộ mốc theo mốc mục tiêu
        for (int i = 0; i < milestones.size(); i++) {
            TimelineMilestone m = milestones.get(i);
            if (i < targetIndex) {
                m.setStartDate(now.minus(Duration.ofDays(14 * (targetIndex - i + 1))));
                m.setEndDate(now.minusSeconds(60));
            } else if (i == targetIndex) {
                m.setStartDate(now.minusSeconds(60));
                m.setEndDate(now.plus(Duration.ofDays(14)));
            } else {
                m.setStartDate(now.plus(Duration.ofDays(14 * (i - targetIndex))));
                m.setEndDate(now.plus(Duration.ofDays(14 * (i - targetIndex + 1))));
            }
        }
        timelineMilestoneRepository.saveAll(milestones);

        // Cập nhật trạng thái vòng đời đợt đồ án
        TimelineMilestone activeMilestone = milestones.get(targetIndex);
        String phase = activeMilestone.getPhaseType() != null ? activeMilestone.getPhaseType().toUpperCase() : "";
        if ("REGISTRATION".equalsIgnoreCase(phase)) {
            round.setStatus("OPEN");
        } else {
            round.setStatus("IN_PROGRESS");
        }
        round = projectRoundRepository.save(round);

        // Đánh giá và cập nhật trạng thái đạt / không đạt của toàn bộ sinh viên trong đợt khi kết thúc giai đoạn
        evaluateStudentsOnPhaseAdvance(roundId, targetIndex, milestones);

        return toResponseDTO(round, milestones);
    }

    private int getStageNumberFromPhase(String phaseType) {
        if (!StringUtils.hasText(phaseType)) return 1;
        String pt = phaseType.toUpperCase();
        if (pt.contains("DRAFT")) return 1;
        if (pt.contains("REGISTRATION")) return 2;
        if (pt.contains("PROPOSAL")) return 3;
        if (pt.contains("WEEKLY") || pt.contains("REPORT") || pt.contains("TASK")) return 4;
        if (pt.contains("DEFENSE") || pt.contains("ELIGIB") || pt.contains("COMMITTEE")) return 5;
        return 2;
    }

    /**
     * Tự động đánh giá kết quả đạt / không đạt của toàn bộ sinh viên trong đợt khi kết thúc giai đoạn.
     * Sinh viên chưa làm nhiệm vụ của giai đoạn trước sẽ bị loại (DROPPED - Không đạt).
     */
    private void evaluateStudentsOnPhaseAdvance(Long roundId, int targetIndex, List<TimelineMilestone> milestones) {
        if (studentProjectRoundRepository == null || milestones == null || milestones.isEmpty()) {
            return;
        }

        List<StudentProjectRound> roundStudents = studentProjectRoundRepository.findByProjectRoundId(roundId);
        if (roundStudents.isEmpty()) {
            return;
        }

        TimelineMilestone targetMilestone = milestones.get(Math.min(targetIndex, milestones.size() - 1));
        int targetStage = getStageNumberFromPhase(targetMilestone.getPhaseType());

        // Nếu admin quay lại GĐ1 (DRAFT): Khôi phục các sinh viên bị loại do deadline để demo lại từ đầu
        if (targetStage <= 1) {
            List<StudentProjectRound> restored = new ArrayList<>();
            for (StudentProjectRound spr : roundStudents) {
                if ("DROPPED".equalsIgnoreCase(spr.getStatus()) && spr.getNote() != null && spr.getNote().contains("Không hoàn thành")) {
                    spr.setStatus("ELIGIBLE");
                    spr.setNote("Khôi phục trạng thái ELIGIBLE khi quay lại GĐ1 (Demo)");
                    restored.add(spr);
                }
            }
            if (!restored.isEmpty()) {
                studentProjectRoundRepository.saveAll(restored);
                log.info("advanceRoundPhase [Round {}]: Đã khôi phục {} sinh viên về ELIGIBLE khi về GĐ1", roundId, restored.size());
            }
            return;
        }

        // 1. Kiểm tra GĐ2 (Chọn hướng & NV1-NV3): Có bản ghi đăng ký hướng, nguyện vọng hoặc đã được phân công GVHD
        Set<Long> registeredG2StudentIds = Collections.emptySet();
        if (targetStage >= 3) {
            Set<Long> sIds = new java.util.HashSet<>();
            if (directionRegistrationRepository != null) {
                directionRegistrationRepository.findByProjectRoundId(roundId).forEach(r -> {
                    if (r.getStudentId() != null) sIds.add(r.getStudentId());
                });
            }
            if (preferenceRepository != null) {
                preferenceRepository.findByProjectRoundIdOrderByStudentIdAscPriorityAsc(roundId).forEach(p -> {
                    if (p.getStudentId() != null) sIds.add(p.getStudentId());
                });
            }
            if (supervisorAssignmentRepository != null) {
                supervisorAssignmentRepository.findByProjectRoundId(roundId).forEach(a -> {
                    if (a.getStudentId() != null) sIds.add(a.getStudentId());
                });
            }
            registeredG2StudentIds = sIds;
        }

        // 2. Kiểm tra GĐ3 (Nộp & Duyệt đề cương): Có đề cương hoặc có bản ghi đề tài
        Set<Long> approvedG3StudentIds = Collections.emptySet();
        if (targetStage >= 4) {
            Set<Long> sIds = new java.util.HashSet<>();
            ProjectRound roundObj = projectRoundRepository.findById(roundId).orElse(null);
            if (proposalRepository != null) {
                proposalRepository.findByProjectRoundId(roundId).forEach(p -> {
                    if (p.getStudent() != null && p.getStudent().getId() != null) {
                        String st = p.getStatus() != null ? p.getStatus().toUpperCase() : "";
                        if (!"REJECTED".equals(st)) {
                            if (!"APPROVED".equals(st)) {
                                p.setStatus("APPROVED");
                                p.setSupervisorApproved(true);
                                proposalRepository.save(p);
                            }
                            sIds.add(p.getStudent().getId());
                            if (thesisRepository != null && roundObj != null && p.getLecturer() != null
                                    && !thesisRepository.existsByStudentIdAndProjectRoundId(p.getStudent().getId(), roundId)) {
                                String thesisCode = "DT_" + roundObj.getRoundCode() + "_" + p.getStudent().getStudentCode();
                                com.example.thesis_hub_api.thesis.entity.Thesis thesis = com.example.thesis_hub_api.thesis.entity.Thesis.builder()
                                        .proposal(p)
                                        .projectRound(roundObj)
                                        .student(p.getStudent())
                                        .lecturer(p.getLecturer())
                                        .thesisCode(thesisCode)
                                        .titleVn(p.getTitleVn())
                                        .titleEn(p.getTitleEn())
                                        .description(p.getDescription())
                                        .objectives(p.getObjectives())
                                        .status("IN_PROGRESS")
                                        .completionRate(java.math.BigDecimal.ZERO)
                                        .defenseEligible(false)
                                        .build();
                                thesisRepository.save(thesis);
                            }
                        }
                    }
                });
            }
            if (thesisRepository != null) {
                thesisRepository.findByProjectRoundId(roundId).forEach(t -> {
                    if (t.getStudent() != null && t.getStudent().getId() != null) {
                        sIds.add(t.getStudent().getId());
                    }
                });
            }
            approvedG3StudentIds = sIds;
        }

        // 3. Kiểm tra GĐ4 (Tiến độ & Đủ điều kiện bảo vệ): Có defenseEligible == true hoặc DEFENSE_READY
        Set<Long> readyG4StudentIds = Collections.emptySet();
        if (targetStage >= 5) {
            Set<Long> sIds = new java.util.HashSet<>();
            if (thesisRepository != null) {
                thesisRepository.findByProjectRoundId(roundId).forEach(t -> {
                    if (t.getStudent() != null && t.getStudent().getId() != null) {
                        if (Boolean.TRUE.equals(t.getDefenseEligible()) || "DEFENSE_READY".equalsIgnoreCase(t.getStatus())) {
                            sIds.add(t.getStudent().getId());
                        }
                    }
                });
            }
            readyG4StudentIds = sIds;
        }

        List<StudentProjectRound> toSave = new ArrayList<>();
        for (StudentProjectRound spr : roundStudents) {
            if (spr.getStudent() == null || spr.getStudent().getId() == null) {
                continue;
            }
            Long sId = spr.getStudent().getId();

            if ("RESERVED".equalsIgnoreCase(spr.getStatus())) {
                continue;
            }

            // Kiểm tra điều kiện GĐ2
            if (targetStage >= 3 && !registeredG2StudentIds.contains(sId)) {
                if (!"DROPPED".equalsIgnoreCase(spr.getStatus())) {
                    spr.setStatus("DROPPED");
                    spr.setNote("Không hoàn thành GĐ2: Chưa đăng ký nguyện vọng/hướng đồ án - Bị loại khỏi đợt đồ án (Không đạt)");
                    toSave.add(spr);
                }
                continue;
            }

            // Kiểm tra điều kiện GĐ3
            if (targetStage >= 4 && !approvedG3StudentIds.contains(sId)) {
                if (!"DROPPED".equalsIgnoreCase(spr.getStatus())) {
                    spr.setStatus("DROPPED");
                    spr.setNote("Không hoàn thành GĐ3: Chưa nộp hoặc chưa được duyệt đề cương đồ án - Bị loại khỏi đợt đồ án (Không đạt)");
                    toSave.add(spr);
                }
                continue;
            }

            // Kiểm tra điều kiện GĐ4
            if (targetStage >= 5 && !readyG4StudentIds.contains(sId)) {
                if (!"DROPPED".equalsIgnoreCase(spr.getStatus())) {
                    spr.setStatus("DROPPED");
                    spr.setNote("Không hoàn thành GĐ4: Chưa đủ điều kiện bảo vệ đồ án tốt nghiệp trước hội đồng - Bị loại khỏi đợt đồ án (Không đạt)");
                    toSave.add(spr);
                }
                continue;
            }

            // Nếu đạt và chưa bị DROPPED: Cập nhật trạng thái tương ứng với giai đoạn mới
            if (!"DROPPED".equalsIgnoreCase(spr.getStatus())) {
                if (targetStage >= 5) {
                    spr.setStatus("DEFENSE_READY");
                } else if (targetStage >= 4) {
                    spr.setStatus("IN_PROGRESS");
                } else if (targetStage >= 3) {
                    spr.setStatus("ASSIGNED");
                }
                toSave.add(spr);
            }
        }

        if (!toSave.isEmpty()) {
            studentProjectRoundRepository.saveAll(toSave);
            log.info("advanceRoundPhase [Round {}]: Đã cập nhật trạng thái kết quả cho {} sinh viên (targetStage={})",
                    roundId, toSave.size(), targetStage);
        }
    }

    /**
     * Tra cứu trạng thái đợt đồ án và kết quả cá nhân của sinh viên hiện tại
     */
    @Transactional(readOnly = true)
    public StudentRoundStatusResponseDTO getMyRoundStatus(UserPrincipal currentUser) {
        if (currentUser == null) {
            return StudentRoundStatusResponseDTO.builder()
                    .hasActiveRound(false)
                    .inRound(false)
                    .build();
        }

        ProjectRound systemActiveRound = projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("OPEN")
                .or(() -> projectRoundRepository.findFirstByStatusOrderByCreatedAtDesc("IN_PROGRESS"))
                .orElse(null);

        Student student = studentRepository != null
                ? studentRepository.findByUserId(currentUser.getId()).orElse(null)
                : null;

        if (student == null) {
            if (systemActiveRound == null) {
                return StudentRoundStatusResponseDTO.builder()
                        .hasActiveRound(false)
                        .inRound(false)
                        .build();
            }
            return StudentRoundStatusResponseDTO.builder()
                    .hasActiveRound(true)
                    .roundId(systemActiveRound.getId())
                    .roundCode(systemActiveRound.getRoundCode())
                    .roundName(systemActiveRound.getName())
                    .roundStatus(systemActiveRound.getStatus())
                    .inRound(false)
                    .build();
        }

        StudentProjectRound spr = null;
        if (studentProjectRoundRepository != null) {
            List<StudentProjectRound> enrollments = studentProjectRoundRepository.findByStudentId(student.getId());
            if (enrollments != null && !enrollments.isEmpty()) {
                spr = enrollments.stream()
                        .filter(e -> e.getProjectRound() != null)
                        .min(Comparator.comparingInt((StudentProjectRound e) -> {
                            String rStatus = e.getProjectRound().getStatus() != null
                                    ? e.getProjectRound().getStatus().toUpperCase()
                                    : "";
                            boolean isReserved = "RESERVED".equalsIgnoreCase(e.getStatus());
                            if (!isReserved && ("OPEN".equals(rStatus) || "IN_PROGRESS".equals(rStatus))) {
                                return 0;
                            }
                            if (!isReserved && "DRAFT".equals(rStatus)) {
                                return 1;
                            }
                            if ("OPEN".equals(rStatus) || "IN_PROGRESS".equals(rStatus)) {
                                return 2;
                            }
                            return 3;
                        }).thenComparing((StudentProjectRound e) ->
                                e.getProjectRound().getId() != null ? -e.getProjectRound().getId() : 0L))
                        .orElse(null);
            }
            if (spr == null && systemActiveRound != null) {
                spr = studentProjectRoundRepository
                        .findByStudentIdAndProjectRoundId(student.getId(), systemActiveRound.getId())
                        .orElse(null);
            }
        }

        if (spr == null || spr.getProjectRound() == null) {
            return StudentRoundStatusResponseDTO.builder()
                    .hasActiveRound(systemActiveRound != null)
                    .roundId(systemActiveRound != null ? systemActiveRound.getId() : null)
                    .roundCode(systemActiveRound != null ? systemActiveRound.getRoundCode() : null)
                    .roundName(systemActiveRound != null ? systemActiveRound.getName() : null)
                    .roundStatus(systemActiveRound != null ? systemActiveRound.getStatus() : null)
                    .studentId(student.getId())
                    .studentCode(student.getStudentCode())
                    .fullName(currentUser.getFullName())
                    .inRound(false)
                    .build();
        }

        ProjectRound activeRound = spr.getProjectRound();
        Long roundId = activeRound.getId();

        boolean isDropped = "DROPPED".equalsIgnoreCase(spr.getStatus());
        String status = spr.getStatus();
        int completedStage = 1;

        if (!isDropped) {
            if ("DEFENSE_READY".equalsIgnoreCase(status) || "DEFENDED".equalsIgnoreCase(status)) {
                completedStage = 4;
            } else if ("IN_PROGRESS".equalsIgnoreCase(status)) {
                completedStage = 3;
            } else if ("ASSIGNED".equalsIgnoreCase(status) || "REGISTERED".equalsIgnoreCase(status)) {
                completedStage = 2;
            } else {
                completedStage = 1;
            }
        } else {
            if (spr.getNote() != null && spr.getNote().contains("GĐ4")) {
                completedStage = 3;
            } else if (spr.getNote() != null && spr.getNote().contains("GĐ3")) {
                completedStage = 2;
            } else {
                completedStage = 1;
            }
        }

        List<TimelineMilestone> milestones = timelineMilestoneRepository
                .findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(roundId);
        int currentRoundStage = 2;
        Instant now = Instant.now();
        for (TimelineMilestone m : milestones) {
            if (!now.isBefore(m.getStartDate()) && !now.isAfter(m.getEndDate())) {
                currentRoundStage = getStageNumberFromPhase(m.getPhaseType());
                break;
            }
        }

        return StudentRoundStatusResponseDTO.builder()
                .hasActiveRound(true)
                .inRound(true)
                .roundId(roundId)
                .roundCode(activeRound.getRoundCode())
                .roundName(activeRound.getName())
                .roundStatus(activeRound.getStatus())
                .roundCurrentStage(currentRoundStage)
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .fullName(currentUser.getFullName())
                .status(status)
                .note(spr.getNote())
                .isDropped(isDropped)
                .completedStage(completedStage)
                .build();
    }

    private int findMilestoneIndex(List<TimelineMilestone> milestones, String phaseType, int defaultIdx) {
        for (int i = 0; i < milestones.size(); i++) {
            if (phaseType.equalsIgnoreCase(milestones.get(i).getPhaseType())) {
                return i;
            }
        }
        return Math.min(defaultIdx, milestones.size() - 1);
    }

    // ─── MAPPER HELPERS ────────────────────────────────────────────────────────
    private ProjectRoundResponseDTO toResponseDTO(ProjectRound round) {
        return toResponseDTO(round, null);
    }

    private ProjectRoundResponseDTO toResponseDTO(ProjectRound round, List<TimelineMilestone> explicitMilestones) {
        Instant now = Instant.now();
        List<TimelineMilestone> rawMilestones = (explicitMilestones != null) ? explicitMilestones :
                ((round.getMilestones() != null) ? round.getMilestones() : List.of());

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

    @Transactional
    public void deleteRound(Long roundId) {
        ProjectRound round = projectRoundRepository.findById(roundId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đợt đồ án với ID: " + roundId));

        String status = (round.getStatus() != null) ? round.getStatus().toUpperCase() : "";
        if ("OPEN".equals(status) || "IN_PROGRESS".equals(status)) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Không thể xóa đợt đồ án đang hoạt động (" + status + "). Chỉ có thể xóa các đợt đồ án ở trạng thái Bản nháp (DRAFT) hoặc Đã đóng (CLOSED/ARCHIVED).");
        }
        log.info("Deleting project round: id={}, code={}, status={}", round.getId(), round.getRoundCode(), status);

        if (jdbcTemplate != null) {
            // Cleanup dependent tables without explicit ON DELETE CASCADE
            jdbcTemplate.update("DELETE FROM scores WHERE thesis_id IN (SELECT id FROM theses WHERE project_round_id = ?)", roundId);
            jdbcTemplate.update("DELETE FROM reviewer_assignments WHERE thesis_id IN (SELECT id FROM theses WHERE project_round_id = ?)", roundId);
            jdbcTemplate.update("DELETE FROM graduation_results WHERE thesis_id IN (SELECT id FROM theses WHERE project_round_id = ?)", roundId);
            jdbcTemplate.update("DELETE FROM reservation_requests WHERE project_round_id = ?", roundId);
            jdbcTemplate.update("DELETE FROM defense_councils WHERE project_round_id = ?", roundId);
            jdbcTemplate.update("DELETE FROM progress_feedbacks WHERE progress_report_id IN (SELECT id FROM progress_reports WHERE thesis_id IN (SELECT id FROM theses WHERE project_round_id = ?))", roundId);
            jdbcTemplate.update("DELETE FROM progress_reports WHERE thesis_id IN (SELECT id FROM theses WHERE project_round_id = ?)", roundId);
            jdbcTemplate.update("DELETE FROM progress_reports WHERE milestone_id IN (SELECT id FROM timeline_milestones WHERE project_round_id = ?)", roundId);
        }

        projectRoundRepository.delete(round);
        log.info("Successfully deleted project round id={}", roundId);
    }
}
