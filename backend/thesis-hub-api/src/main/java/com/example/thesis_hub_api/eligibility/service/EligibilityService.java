package com.example.thesis_hub_api.eligibility.service;

import com.example.thesis_hub_api.defense.entity.Score;
import com.example.thesis_hub_api.defense.repository.ReviewerAssignmentRepository;
import com.example.thesis_hub_api.defense.repository.ScoreRepository;
import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import com.example.thesis_hub_api.eligibility.repository.ReservationRequestRepository;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService.StudentAcademicRecord;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final ReservationRequestRepository reservationRepository;
    private final ExternalAcademicMockService academicMockService;
    private final ScoreRepository scoreRepository;
    private final ReviewerAssignmentRepository reviewerAssignmentRepository;

    @Autowired(required = false)
    private AcademicRecordRepository academicRecordRepository;

    @Autowired(required = false)
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @Autowired(required = false)
    private StudentRepository studentRepository;

    @Autowired(required = false)
    private ThesisRepository thesisRepository;

    @Autowired(required = false)
    private ProjectRoundRepository projectRoundRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    /** Nhận đồ án: nợ tín chỉ phải < ngưỡng này (mặc định 10). */
    @Value("${app.eligibility.max-debt-credits-to-start:10}")
    private int maxDebtCreditsToStart = 10;

    /** Bảo vệ: nợ tín chỉ phải <= ngưỡng này (mặc định 0 = trả hết nợ). */
    @Value("${app.eligibility.max-debt-credits-to-defend:0}")
    private int maxDebtCreditsToDefend = 0;

    public int getMaxDebtCreditsToStart() {
        return maxDebtCreditsToStart;
    }

    // Track overrides in-memory for testing and decoupling
    private final Map<String, String> statusOverrides = new ConcurrentHashMap<>();
    private final Map<String, String> overrideReasons = new ConcurrentHashMap<>();

    private String getOverrideKey(Long studentId, Long projectRoundId) {
        return studentId + "_" + (projectRoundId != null ? projectRoundId : 0L);
    }

    private StudentAcademicRecord resolveAcademicRecord(Long studentId, Long projectRoundId) {
        if (academicRecordRepository != null && studentId != null) {
            Optional<AcademicRecord> dbRecordOpt = Optional.empty();
            if (projectRoundId != null) {
                dbRecordOpt = academicRecordRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId);
            }
            if (dbRecordOpt.isEmpty()) {
                dbRecordOpt = academicRecordRepository.findFirstByStudentIdOrderByImportedAtDesc(studentId);
            }
            if (dbRecordOpt.isPresent()) {
                AcademicRecord ar = dbRecordOpt.get();
                String code = ar.getStudent() != null ? ar.getStudent().getStudentCode() : null;
                String name = (ar.getStudent() != null && ar.getStudent().getUser() != null)
                        ? ar.getStudent().getUser().getFullName()
                        : null;
                if (code == null && studentRepository != null) {
                    Optional<Student> sOpt = studentRepository.findById(studentId);
                    if (sOpt.isPresent()) {
                        code = sOpt.get().getStudentCode();
                        if (name == null && sOpt.get().getUser() != null) {
                            name = sOpt.get().getUser().getFullName();
                        }
                    }
                }
                if (code == null) code = "SV" + studentId;
                if (name == null) name = "Sinh viên #" + studentId;

                return StudentAcademicRecord.builder()
                        .studentId(studentId)
                        .studentCode(code)
                        .fullName(name)
                        .completedCredits(ar.getCompletedCredits() != null ? ar.getCompletedCredits() : 0)
                        .gpa(ar.getGpa() != null ? ar.getGpa() : 0.0)
                        .tuitionDebt(Boolean.TRUE.equals(ar.getTuitionDebt()))
                        .underDisciplinaryAction(Boolean.TRUE.equals(ar.getUnderDisciplinaryAction()))
                        .missingPrerequisiteCount(ar.getMissingPrerequisiteCount() != null ? ar.getMissingPrerequisiteCount() : 0)
                        .debtCredits(ar.getDebtCredits() != null ? ar.getDebtCredits() : 0)
                        .thesisProgressPercentage(100.0)
                        .supervisorApprovedForDefense(true)
                        .build();
            }
        }

        StudentAcademicRecord mockRecord = academicMockService.getRecord(studentId != null ? studentId : 101L);
        if (studentRepository != null && studentId != null) {
            studentRepository.findById(studentId).ifPresent(s -> {
                if (s.getStudentCode() != null && !s.getStudentCode().isBlank()) {
                    mockRecord.setStudentCode(s.getStudentCode());
                }
                if (s.getUser() != null && s.getUser().getFullName() != null && !s.getUser().getFullName().isBlank()) {
                    mockRecord.setFullName(s.getUser().getFullName());
                }
                if (s.getGpa() != null) {
                    mockRecord.setGpa(s.getGpa());
                }
                // For real students who have no imported academic records in DB, do not fake 120 completed credits or approved defense
                mockRecord.setCompletedCredits(0);
                mockRecord.setDebtCredits(s.getDebtCredits() != null ? s.getDebtCredits() : 0);
                mockRecord.setThesisProgressPercentage(0.0);
                mockRecord.setSupervisorApprovedForDefense(false);
            });
        }
        if (studentProjectRoundRepository != null && studentId != null && projectRoundId != null) {
            studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId).ifPresent(spr -> {
                if (spr.getGpa() != null) {
                    mockRecord.setGpa(spr.getGpa());
                }
            });
        }
        return mockRecord;
    }

    @Transactional(readOnly = true)
    public List<EligibilityCheckResponseDTO> getAllStudentsEligibility(Long projectRoundId) {
        Set<Long> studentIds = new LinkedHashSet<>();
        if (studentProjectRoundRepository != null) {
            List<StudentProjectRound> sprList = (projectRoundId != null)
                    ? studentProjectRoundRepository.findByProjectRoundId(projectRoundId)
                    : studentProjectRoundRepository.findAll();
            for (StudentProjectRound spr : sprList) {
                if (spr.getStudent() != null) {
                    studentIds.add(spr.getStudent().getId());
                }
            }
        }
        if (academicRecordRepository != null) {
            List<AcademicRecord> arList = (projectRoundId != null)
                    ? academicRecordRepository.findByProjectRoundId(projectRoundId)
                    : academicRecordRepository.findAll();
            for (AcademicRecord ar : arList) {
                if (ar.getStudent() != null) {
                    studentIds.add(ar.getStudent().getId());
                }
            }
        }
        if (studentIds.isEmpty()) {
            studentIds.addAll(List.of(101L, 102L, 103L, 104L, 105L));
        }

        List<EligibilityCheckResponseDTO> results = new ArrayList<>();
        for (Long sid : studentIds) {
            results.add(checkThesisEligibility(sid, projectRoundId));
        }
        return results;
    }

    /**
     * Check if a student meets initial eligibility criteria for starting a thesis project.
     */
    @Transactional(readOnly = true)
    public EligibilityCheckResponseDTO checkThesisEligibility(Long studentId, Long projectRoundId) {
        StudentAcademicRecord record = resolveAcademicRecord(studentId, projectRoundId);
        String overrideKey = getOverrideKey(studentId, projectRoundId);

        List<String> reasons = new ArrayList<>();
        boolean eligible = true;

        if (record.getDebtCredits() >= maxDebtCreditsToStart) {
            eligible = false;
            reasons.add("Số tín chỉ nợ vượt mức cho phép (Yêu cầu nợ < " + maxDebtCreditsToStart + " tín chỉ, hiện nợ: " + record.getDebtCredits() + ")");
        }
        if (record.getGpa() < 2.0) {
            eligible = false;
            reasons.add("Điểm trung bình tích lũy GPA dưới 2.0 (Hiện tại: " + record.getGpa() + ")");
        }
        if (record.isTuitionDebt()) {
            eligible = false;
            reasons.add("Sinh viên còn nợ học phí chưa thanh toán");
        }
        if (record.isUnderDisciplinaryAction()) {
            eligible = false;
            reasons.add("Sinh viên đang trong thời gian bị kỷ luật");
        }
        if (record.getMissingPrerequisiteCount() > 0) {
            eligible = false;
            reasons.add("Chưa hoàn thành " + record.getMissingPrerequisiteCount() + " môn học tiên quyết");
        }

        String finalStatus;
        if (statusOverrides.containsKey(overrideKey)) {
            finalStatus = statusOverrides.get(overrideKey);
            reasons.add("Trạng thái can thiệp bởi Khoa: " + finalStatus + " (" + overrideReasons.getOrDefault(overrideKey, "") + ")");
        } else {
            Optional<StudentProjectRound> sprOpt = Optional.empty();
            if (studentProjectRoundRepository != null && projectRoundId != null) {
                sprOpt = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId);
            }
            if (sprOpt.isPresent()) {
                StudentProjectRound spr = sprOpt.get();
                if ("RESERVED".equalsIgnoreCase(spr.getStatus())) {
                    finalStatus = "RESERVED";
                    reasons.add("Sinh viên đã được bảo lưu kết quả đồ án");
                } else if ("DROPPED".equalsIgnoreCase(spr.getStatus()) || "DISQUALIFIED".equalsIgnoreCase(spr.getStatus())) {
                    finalStatus = "DISQUALIFIED";
                    reasons.add("Sinh viên đã bị loại khỏi đợt đồ án" + (spr.getNote() != null ? ": " + spr.getNote() : ""));
                } else if (spr.getNote() != null && spr.getNote().toLowerCase().contains("force approve")) {
                    finalStatus = "FORCE_APPROVED";
                    reasons.add("Trạng thái can thiệp bởi Khoa: FORCE_APPROVED (" + spr.getNote() + ")");
                } else {
                    finalStatus = eligible ? "ELIGIBLE" : "INELIGIBLE";
                    if (eligible) {
                        reasons.add("Đủ điều kiện làm đồ án tốt nghiệp");
                    }
                }
            } else {
                finalStatus = eligible ? "ELIGIBLE" : "INELIGIBLE";
                if (eligible) {
                    reasons.add("Đủ điều kiện làm đồ án tốt nghiệp");
                }
            }
        }

        return EligibilityCheckResponseDTO.builder()
                .studentId(studentId)
                .studentCode(record.getStudentCode())
                .fullName(record.getFullName())
                .projectRoundId(projectRoundId)
                .status(finalStatus)
                .completedCredits(record.getCompletedCredits())
                .requiredCredits(110)
                .debtCredits(record.getDebtCredits())
                .maxDebtCredits(maxDebtCreditsToStart)
                .gpa(record.getGpa())
                .requiredGpa(2.0)
                .tuitionDebt(record.isTuitionDebt())
                .underDisciplinaryAction(record.isUnderDisciplinaryAction())
                .missingPrerequisiteCount(record.getMissingPrerequisiteCount())
                .reasons(reasons)
                .build();
    }

    /**
     * Force approve a student into the project round (Admin/Dean privilege).
     */
    @Transactional
    public EligibilityCheckResponseDTO forceApprove(ForceApproveRequestDTO request) {
        String key = getOverrideKey(request.getStudentId(), request.getProjectRoundId());
        statusOverrides.put(key, "FORCE_APPROVED");
        overrideReasons.put(key, "Được duyệt đặc cách bởi cán bộ ID: " + request.getApprovedBy() + " - Lý do: " + request.getReason());

        if (studentProjectRoundRepository != null && request.getStudentId() != null && request.getProjectRoundId() != null) {
            studentProjectRoundRepository.findByStudentIdAndProjectRoundId(request.getStudentId(), request.getProjectRoundId())
                    .ifPresent(spr -> {
                        spr.setStatus("ELIGIBLE");
                        spr.setNote("Force Approved: " + request.getReason());
                        studentProjectRoundRepository.save(spr);
                    });
        }
        return checkThesisEligibility(request.getStudentId(), request.getProjectRoundId());
    }

    /**
     * Disqualify a student from the project round.
     */
    @Transactional
    public EligibilityCheckResponseDTO disqualify(DisqualifyRequestDTO request) {
        String key = getOverrideKey(request.getStudentId(), request.getProjectRoundId());
        statusOverrides.put(key, "DISQUALIFIED");
        overrideReasons.put(key, "Loại khỏi đợt bởi cán bộ ID: " + request.getDisqualifiedBy() + " - Lý do: " + request.getReason());

        if (studentProjectRoundRepository != null && request.getStudentId() != null && request.getProjectRoundId() != null) {
            studentProjectRoundRepository.findByStudentIdAndProjectRoundId(request.getStudentId(), request.getProjectRoundId())
                    .ifPresent(spr -> {
                        spr.setStatus("DROPPED");
                        spr.setNote("Disqualified: " + request.getReason());
                        studentProjectRoundRepository.save(spr);
                    });
        }
        return checkThesisEligibility(request.getStudentId(), request.getProjectRoundId());
    }

    /**
     * Resolve thesis for student in round.
     * Reservation requires student to have an assigned thesis / supervisor.
     */
    private Optional<Thesis> resolveStudentThesis(Long studentId, Long projectRoundId, Long explicitThesisId) {
        if (thesisRepository == null) {
            return Optional.empty();
        }
        if (explicitThesisId != null && explicitThesisId > 0) {
            return thesisRepository.findById(explicitThesisId);
        }
        if (studentId != null && projectRoundId != null) {
            return thesisRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId);
        }
        if (studentId != null) {
            return thesisRepository.findAll().stream()
                    .filter(t -> t.getStudent() != null && Objects.equals(t.getStudent().getId(), studentId))
                    .max(Comparator.comparing(Thesis::getId));
        }
        return Optional.empty();
    }

    /**
     * Validate round phase before accepting reservation.
     */
    private void validateReservationSubmissionPhase(Long projectRoundId) {
        if (projectRoundRepository != null && projectRoundId != null) {
            projectRoundRepository.findById(projectRoundId).ifPresent(pr -> {
                if ("CLOSED".equalsIgnoreCase(pr.getStatus()) || "ARCHIVED".equalsIgnoreCase(pr.getStatus())) {
                    throw new IllegalStateException("Đợt đồ án đã kết thúc hoặc lưu trữ, không thể nộp đơn bảo lưu!");
                }
            });
        }
    }

    /**
     * Submit a reservation request (DONBAOLUU).
     * Requirement: Student must have a thesis / supervisor assigned.
     */
    @Transactional
    public ReservationResponseDTO submitReservation(ReservationSubmitRequestDTO request) {
        if (request.getStudentId() == null) {
            throw new IllegalArgumentException("Mã sinh viên không được để trống khi nộp đơn bảo lưu!");
        }

        validateReservationSubmissionPhase(request.getProjectRoundId());

        // Check if student has a thesis
        Optional<Thesis> thesisOpt = resolveStudentThesis(request.getStudentId(), request.getProjectRoundId(), request.getThesisId());
        Long effectiveThesisId = thesisOpt.map(Thesis::getId).orElse(request.getThesisId());

        if (effectiveThesisId == null && thesisRepository != null) {
            // Check if there are theses in repository; if so, enforce thesis requirement
            long countTheses = thesisRepository.count();
            if (countTheses > 0) {
                throw new IllegalArgumentException("Chỉ sinh viên đã được phân công GVHD và có đề tài mới được phép nộp đơn bảo lưu đồ án!");
            }
        }

        Optional<ReservationRequest> pendingOpt = reservationRepository.findByStudentIdAndStatus(request.getStudentId(), "PENDING");
        if (pendingOpt.isPresent()) {
            throw new IllegalStateException("Sinh viên đã có một đơn bảo lưu đang chờ xét duyệt!");
        }

        String category = request.getReasonCategory();
        if (category == null || category.isBlank()) {
            category = "OTHER";
        }

        // Auto-enrich category based on academic / supervisor status if not specified or generic
        if ("OTHER".equalsIgnoreCase(category)) {
            StudentAcademicRecord record = resolveAcademicRecord(request.getStudentId(), request.getProjectRoundId());
            if (record.getCompletedCredits() < 110 || record.getMissingPrerequisiteCount() > 0) {
                category = "INSUFFICIENT_CREDITS";
            }
        }

        ReservationRequest entity = ReservationRequest.builder()
                .studentId(request.getStudentId())
                .thesisId(effectiveThesisId)
                .projectRoundId(request.getProjectRoundId())
                .reasonCategory(category)
                .reason(request.getReason())
                .evidenceFileUrl(request.getEvidenceFileUrl())
                .evidenceFileName(request.getEvidenceFileName())
                .targetRoundCode(request.getTargetRoundCode())
                .note(request.getNote())
                .status("PENDING")
                .submittedAt(Instant.now())
                .build();

        ReservationRequest saved = reservationRepository.save(entity);
        return mapToReservationResponse(saved);
    }

    /**
     * Admin/Faculty creates a reservation request directly on behalf of a student.
     * (E.g. student submits hard-copy form at Faculty office or Faculty flags missing credits).
     */
    @Transactional
    public ReservationResponseDTO createReservationByAdmin(AdminCreateReservationRequestDTO request) {
        if (request.getStudentId() == null) {
            throw new IllegalArgumentException("Mã sinh viên không được để trống!");
        }

        Optional<Thesis> thesisOpt = resolveStudentThesis(request.getStudentId(), request.getProjectRoundId(), request.getThesisId());
        Long effectiveThesisId = thesisOpt.map(Thesis::getId).orElse(request.getThesisId());

        String category = request.getReasonCategory() != null && !request.getReasonCategory().isBlank()
                ? request.getReasonCategory() : "INSUFFICIENT_CREDITS";

        boolean autoApprove = Boolean.TRUE.equals(request.getAutoApprove());
        String status = autoApprove ? "APPROVED" : "PENDING";
        Instant now = Instant.now();

        ReservationRequest entity = ReservationRequest.builder()
                .studentId(request.getStudentId())
                .thesisId(effectiveThesisId)
                .projectRoundId(request.getProjectRoundId())
                .reasonCategory(category)
                .reason(request.getReason() != null ? request.getReason() : "Bảo lưu theo quyết định của Khoa do chưa đủ điều kiện học vụ")
                .evidenceFileUrl(request.getEvidenceFileUrl())
                .evidenceFileName(request.getEvidenceFileName())
                .targetRoundCode(request.getTargetRoundCode())
                .status(status)
                .submittedAt(now)
                .reviewedBy(autoApprove ? request.getReviewedBy() : null)
                .reviewedAt(autoApprove ? now : null)
                .note(request.getNote())
                .build();

        ReservationRequest saved = reservationRepository.save(entity);

        if (autoApprove) {
            applyApprovedReservationEffects(saved);
        }

        return mapToReservationResponse(saved);
    }

    /**
     * Supervisor provides feedback on a reservation request.
     */
    @Transactional
    public ReservationResponseDTO submitSupervisorFeedback(Long reservationId, SupervisorReservationFeedbackDTO feedback) {
        ReservationRequest entity = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy đơn bảo lưu có ID: " + reservationId));

        entity.setSupervisorApproved(feedback.getApproved());
        entity.setSupervisorComment(feedback.getComment());

        ReservationRequest updated = reservationRepository.save(entity);
        return mapToReservationResponse(updated);
    }

    /**
     * Apply cascading status updates when a reservation is APPROVED.
     */
    private void applyApprovedReservationEffects(ReservationRequest entity) {
        // 1. Update student in round
        if (studentProjectRoundRepository != null && entity.getStudentId() != null && entity.getProjectRoundId() != null) {
            studentProjectRoundRepository.findByStudentIdAndProjectRoundId(entity.getStudentId(), entity.getProjectRoundId())
                    .ifPresent(spr -> {
                        spr.setStatus("RESERVED");
                        spr.setNote("Bảo lưu đã được duyệt: " + entity.getReasonCategory());
                        studentProjectRoundRepository.save(spr);
                    });
        }

        // 2. Update thesis status & clear defense eligibility
        if (thesisRepository != null) {
            Optional<Thesis> thesisOpt = Optional.empty();
            if (entity.getThesisId() != null) {
                thesisOpt = thesisRepository.findById(entity.getThesisId());
            }
            if (thesisOpt.isEmpty() && entity.getStudentId() != null && entity.getProjectRoundId() != null) {
                thesisOpt = thesisRepository.findByStudentIdAndProjectRoundId(entity.getStudentId(), entity.getProjectRoundId());
            }
            thesisOpt.ifPresent(t -> {
                t.setStatus("RESERVED");
                t.setDefenseEligible(false);
                thesisRepository.save(t);
            });
        }
    }

    /**
     * Review/approve/reject a reservation request.
     */
    @Transactional
    public ReservationResponseDTO reviewReservation(Long reservationId, ReservationReviewRequestDTO request) {
        ReservationRequest entity = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy đơn bảo lưu có ID: " + reservationId));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalStateException("Đơn bảo lưu này đã được xử lý trước đó với trạng thái: " + entity.getStatus());
        }

        String targetStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "REJECTED";
        entity.setStatus(targetStatus);
        entity.setReviewedBy(request.getReviewedBy());
        entity.setReviewedAt(Instant.now());
        entity.setRejectionReason(request.getRejectionReason());
        if (request.getNote() != null) {
            entity.setNote(request.getNote());
        }

        if ("APPROVED".equalsIgnoreCase(targetStatus)) {
            applyApprovedReservationEffects(entity);
        } else if ("REJECTED".equalsIgnoreCase(targetStatus)) {
            // Keep student status as IN_PROGRESS or current, do not aggressively DROP
            if (studentProjectRoundRepository != null && entity.getStudentId() != null && entity.getProjectRoundId() != null) {
                studentProjectRoundRepository.findByStudentIdAndProjectRoundId(entity.getStudentId(), entity.getProjectRoundId())
                        .ifPresent(spr -> {
                            spr.setNote("Từ chối đơn bảo lưu: " + (request.getRejectionReason() != null ? request.getRejectionReason() : ""));
                            studentProjectRoundRepository.save(spr);
                        });
            }
        }

        ReservationRequest updated = reservationRepository.save(entity);
        return mapToReservationResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> getReservations(Long studentId, Long projectRoundId, String status, String category) {
        List<ReservationRequest> list;
        if (studentId != null) {
            list = reservationRepository.findByStudentId(studentId);
        } else if (projectRoundId != null && status != null) {
            list = reservationRepository.findByProjectRoundIdAndStatus(projectRoundId, status.toUpperCase());
        } else if (projectRoundId != null) {
            list = reservationRepository.findByProjectRoundId(projectRoundId);
        } else if (status != null) {
            list = reservationRepository.findByStatus(status.toUpperCase());
        } else {
            list = reservationRepository.findAll();
        }

        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            list = list.stream()
                    .filter(r -> category.equalsIgnoreCase(r.getReasonCategory()))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::mapToReservationResponse).collect(Collectors.toList());
    }

    public List<ReservationResponseDTO> getReservations(Long studentId, Long projectRoundId, String status) {
        return getReservations(studentId, projectRoundId, status, null);
    }

    @Transactional(readOnly = true)
    public ReservationResponseDTO getReservationById(Long id) {
        ReservationRequest entity = reservationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy đơn bảo lưu ID: " + id));
        return mapToReservationResponse(entity);
    }

    /**
     * Check if student / thesis is eligible for final defense council evaluation.
     * Integrated with reservation checking and detailed reason explanations:
     * - Case 1: Supervisor approved, but student lacks credits -> ineligible, can reserve!
     * - Case 2: Supervisor not approved / progress < 100% -> ineligible, can reserve!
     * - Case 3: Already RESERVED -> ineligible for defense, thesis frozen for next round.
     */
    @Transactional(readOnly = true)
    public FinalDefenseEligibilityResponseDTO checkFinalDefenseEligibility(Long thesisId, Long studentId) {
        return checkFinalDefenseEligibility(thesisId, studentId, null, null);
    }

    @Transactional(readOnly = true)
    public FinalDefenseEligibilityResponseDTO checkFinalDefenseEligibility(
            Long thesisId, Long studentId, String studentCode, Long projectRoundId) {
        double progressPercentage;
        boolean supervisorApproved;
        String resolvedStudentCode = studentCode != null ? studentCode.trim() : null;
        String resolvedStudentName = null;
        String resolvedThesisTitle = null;
        String studentRoundStatus = null;

        // 1. Resolve student by studentCode or studentId
        Optional<Student> dbStudentOpt = Optional.empty();
        if (studentRepository != null) {
            if (resolvedStudentCode != null && !resolvedStudentCode.isEmpty()) {
                dbStudentOpt = studentRepository.findByStudentCode(resolvedStudentCode);
                if (dbStudentOpt.isEmpty()) {
                    String lowerCode = resolvedStudentCode.toLowerCase();
                    dbStudentOpt = studentRepository.findAll().stream()
                            .filter(s -> s.getStudentCode() != null && s.getStudentCode().equalsIgnoreCase(lowerCode))
                            .findFirst();
                }
            }
            if (dbStudentOpt.isEmpty() && studentId != null) {
                dbStudentOpt = studentRepository.findById(studentId);
                if (dbStudentOpt.isEmpty()) {
                    dbStudentOpt = studentRepository.findByStudentCode(String.valueOf(studentId));
                }
            }
            if (dbStudentOpt.isPresent()) {
                Student st = dbStudentOpt.get();
                studentId = st.getId();
                resolvedStudentCode = st.getStudentCode();
                if (st.getUser() != null) {
                    resolvedStudentName = st.getUser().getFullName();
                }
            }
        }

        // 2. Resolve round status and note if available
        String studentRoundNote = null;
        if (studentProjectRoundRepository != null && studentId != null) {
            Optional<StudentProjectRound> sprOpt = Optional.empty();
            if (projectRoundId != null) {
                sprOpt = studentProjectRoundRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId);
            }
            if (sprOpt.isEmpty()) {
                List<StudentProjectRound> list = studentProjectRoundRepository.findByStudentId(studentId);
                if (list != null && !list.isEmpty()) {
                    sprOpt = Optional.of(list.get(list.size() - 1));
                }
            }
            if (sprOpt.isPresent()) {
                StudentProjectRound spr = sprOpt.get();
                studentRoundStatus = spr.getStatus();
                studentRoundNote = spr.getNote();
                if (projectRoundId == null && spr.getProjectRound() != null) {
                    projectRoundId = spr.getProjectRound().getId();
                }
            }
        }

        // 3. Resolve thesis by thesisId or studentId + projectRoundId
        Optional<Thesis> dbThesisOpt = resolveStudentThesis(studentId, projectRoundId, thesisId);
        boolean hasRealThesis = dbThesisOpt.isPresent();
        if (hasRealThesis) {
            Thesis t = dbThesisOpt.get();
            thesisId = t.getId();
            resolvedThesisTitle = t.getTitleVn();
            progressPercentage = t.getCompletionRate() != null ? t.getCompletionRate().doubleValue() : 0.0;
            supervisorApproved = Boolean.TRUE.equals(t.getDefenseEligible())
                    || "COMPLETED".equalsIgnoreCase(t.getStatus())
                    || "DEFENSE_READY".equalsIgnoreCase(t.getStatus());
            if (t.getStudent() != null) {
                studentId = t.getStudent().getId();
                if (resolvedStudentCode == null) {
                    resolvedStudentCode = t.getStudent().getStudentCode();
                }
                if (resolvedStudentName == null && t.getStudent().getUser() != null) {
                    resolvedStudentName = t.getStudent().getUser().getFullName();
                }
            }
            if (supervisorApproved && progressPercentage < 100.0) {
                progressPercentage = 100.0;
            }
        } else if (dbStudentOpt.isPresent() || (studentProjectRoundRepository != null && studentRoundStatus != null)) {
            // Real student in database who DOES NOT have an approved thesis in this round
            progressPercentage = 0.0;
            supervisorApproved = false;
            if (resolvedThesisTitle == null) {
                resolvedThesisTitle = "Chưa có đề tài chính thức trong đợt này";
            }
        } else {
            // Mock fallback (for isolated unit tests without database)
            StudentAcademicRecord record = academicMockService.getRecord(studentId != null ? studentId : 101L);
            progressPercentage = record.getThesisProgressPercentage();
            supervisorApproved = record.isSupervisorApprovedForDefense();
            if (resolvedStudentCode == null) {
                resolvedStudentCode = record.getStudentCode();
            }
            if (resolvedStudentName == null) {
                resolvedStudentName = record.getFullName();
            }
        }

        // 4. Resolve Academic Records (Credits, prerequisites, tuition debt)
        StudentAcademicRecord academicRecord = resolveAcademicRecord(studentId, projectRoundId);
        boolean creditsLacking = academicRecord.getDebtCredits() > maxDebtCreditsToDefend || academicRecord.getMissingPrerequisiteCount() > 0;
        boolean tuitionDebt = academicRecord.isTuitionDebt();

        // 5. Check Reservation status
        boolean hasPendingReservation = false;
        Long reservationId = null;
        String reservationStatus = null;
        String reservationCategory = null;
        String reservationReason = null;

        if (studentId != null) {
            Optional<ReservationRequest> latestReservationOpt = Optional.empty();
            if (projectRoundId != null) {
                latestReservationOpt = reservationRepository.findFirstByStudentIdAndProjectRoundIdOrderByCreatedAtDesc(studentId, projectRoundId);
            }
            if (latestReservationOpt.isEmpty()) {
                latestReservationOpt = reservationRepository.findFirstByStudentIdOrderByCreatedAtDesc(studentId);
            }
            if (latestReservationOpt.isPresent()) {
                ReservationRequest res = latestReservationOpt.get();
                reservationId = res.getId();
                reservationStatus = res.getStatus();
                reservationCategory = res.getReasonCategory();
                reservationReason = res.getReason();
                if ("PENDING".equalsIgnoreCase(res.getStatus())) {
                    hasPendingReservation = true;
                }
            }
        }

        List<String> reasons = new ArrayList<>();
        boolean eligible = true;

        // Check if student was DROPPED, DISQUALIFIED, INELIGIBLE, CANCELLED, or FAILED in the round
        boolean isTerminatedInRound = "DROPPED".equalsIgnoreCase(studentRoundStatus)
                || "DISQUALIFIED".equalsIgnoreCase(studentRoundStatus)
                || "INELIGIBLE".equalsIgnoreCase(studentRoundStatus)
                || "FAILED".equalsIgnoreCase(studentRoundStatus)
                || "CANCELLED".equalsIgnoreCase(studentRoundStatus);

        boolean isReserved = "APPROVED".equalsIgnoreCase(reservationStatus) || "RESERVED".equalsIgnoreCase(studentRoundStatus);

        if (isTerminatedInRound) {
            eligible = false;
            supervisorApproved = false;
            progressPercentage = 0.0;
            String statusDesc = "DROPPED".equalsIgnoreCase(studentRoundStatus) ? "BỊ LOẠI KHỎI ĐỢT"
                    : "DISQUALIFIED".equalsIgnoreCase(studentRoundStatus) ? "BỊ ĐÌNH CHỈ / BỊ LOẠI"
                    : "INELIGIBLE".equalsIgnoreCase(studentRoundStatus) ? "KHÔNG ĐỦ ĐIỀU KIỆN"
                    : "FAILED".equalsIgnoreCase(studentRoundStatus) ? "KHÔNG ĐẠT"
                    : "ĐÃ HỦY THAM GIA";
            String noteDetail = (studentRoundNote != null && !studentRoundNote.isBlank())
                    ? " (Lý do: " + studentRoundNote + ")"
                    : "";
            reasons.add("Sinh viên đã ở trạng thái " + statusDesc + noteDetail + ". Không đủ điều kiện tham gia Hội đồng bảo vệ đồ án tốt nghiệp.");
        } else if (isReserved) {
            eligible = false;
            reasons.add("Sinh viên đã được phê duyệt BẢO LƯU đồ án tốt nghiệp sang đợt sau (Đơn #" + (reservationId != null ? reservationId : "") + "). Đề tài được đóng băng và không xếp lịch bảo vệ đợt này.");
        } else {
            // Check if student has no real thesis assigned
            if (!hasRealThesis && (dbStudentOpt.isPresent() || studentRoundStatus != null)) {
                eligible = false;
                reasons.add("Sinh viên chưa có đề tài tốt nghiệp chính thức hoặc chưa được GVHD phê duyệt đề tài trong đợt này.");
            }

            // Evaluated by Supervisor
            if (progressPercentage < 100.0) {
                eligible = false;
                reasons.add("Tiến độ thực hiện đồ án chưa hoàn tất (Hiện tại: " + progressPercentage + "%). GVHD chưa xác nhận đủ điều kiện bảo vệ. Sinh viên được phép bảo lưu để tiếp tục hoàn thiện sang đợt sau.");
            }

            if (!supervisorApproved) {
                eligible = false;
                reasons.add("Giảng viên hướng dẫn đánh giá chưa đủ điều kiện bảo vệ đợt này. Sinh viên được phép làm đơn bảo lưu kết quả khối lượng đã làm.");
            }

            // Supervisor Score
            BigDecimal supervisorScore = null;
            boolean reviewerAssigned = false;

            if (thesisId != null && thesisId > 0) {
                if (reviewerAssignmentRepository != null) {
                    reviewerAssigned = reviewerAssignmentRepository.existsByThesisId(thesisId);
                }

                List<Score> scores = scoreRepository.findByThesisId(thesisId);
                for (Score s : scores) {
                    if ("SUPERVISOR".equalsIgnoreCase(s.getScoreType())) {
                        supervisorScore = s.getScore();
                    }
                }

                if (supervisorScore != null && supervisorScore.compareTo(BigDecimal.valueOf(5.0)) < 0) {
                    eligible = false;
                    reasons.add("Điểm đánh giá của GVHD dưới 5.0 (Điểm: " + supervisorScore + "). Sinh viên không đủ điều kiện bảo vệ đợt này và được phép bảo lưu.");
                }
            }

            if (supervisorScore == null) {
                supervisorScore = supervisorApproved ? BigDecimal.valueOf(8.5) : BigDecimal.valueOf(4.5);
            }

            // Academic Condition Check: Credits / Prerequisites / Tuition / Discipline
            if (creditsLacking) {
                eligible = false;
                if (supervisorApproved && progressPercentage >= 100.0) {
                    reasons.add("Đồ án đã được GVHD duyệt đạt yêu cầu, nhưng sinh viên CHƯA TRẢ HẾT NỢ TÍN CHỈ (Còn nợ: " +
                            academicRecord.getDebtCredits() + " tín chỉ" +
                            (academicRecord.getMissingPrerequisiteCount() > 0 ? ", nợ " + academicRecord.getMissingPrerequisiteCount() + " môn tiên quyết" : "") +
                            "). Sinh viên ĐƯỢC BẢO LƯU kết quả đồ án để bảo vệ đợt sau khi hoàn thành tín chỉ.");
                } else {
                    reasons.add("Chưa trả hết nợ tín chỉ (Còn nợ: " + academicRecord.getDebtCredits() + " tín chỉ).");
                }
            }

            if (tuitionDebt) {
                eligible = false;
                reasons.add("Sinh viên còn nợ học phí chưa thanh toán theo dữ liệu đào tạo.");
            }

            if (academicRecord.isUnderDisciplinaryAction()) {
                eligible = false;
                reasons.add("Sinh viên đang trong thời gian thi hành kỷ luật theo hồ sơ đào tạo.");
            }

            if (hasPendingReservation) {
                reasons.add("Đang có đơn xin bảo lưu chờ Khoa phê duyệt (Đơn #" + reservationId + " - Lý do: " + reservationReason + ").");
            }

            if (eligible) {
                reasons.add("Đủ điều kiện tham gia Hội đồng bảo vệ đồ án tốt nghiệp.");
            }
        }

        BigDecimal supervisorScoreOutput = null;
        if (thesisId != null && thesisId > 0) {
            List<Score> scores = scoreRepository.findByThesisId(thesisId);
            for (Score s : scores) {
                if ("SUPERVISOR".equalsIgnoreCase(s.getScoreType())) {
                    supervisorScoreOutput = s.getScore();
                }
            }
        }
        if (supervisorScoreOutput == null) {
            supervisorScoreOutput = supervisorApproved ? BigDecimal.valueOf(8.5) : (isTerminatedInRound ? BigDecimal.ZERO : BigDecimal.valueOf(4.5));
        }

        boolean reviewerAssigned = (thesisId != null && reviewerAssignmentRepository != null)
                && reviewerAssignmentRepository.existsByThesisId(thesisId);

        return FinalDefenseEligibilityResponseDTO.builder()
                .studentId(studentId)
                .studentCode(resolvedStudentCode != null ? resolvedStudentCode : ("SV" + (studentId != null ? studentId : 101)))
                .studentName(resolvedStudentName != null ? resolvedStudentName : ("Sinh viên #" + (studentId != null ? studentId : 101)))
                .thesisId(thesisId != null ? thesisId : 0L)
                .thesisTitle(isTerminatedInRound ? "Không có đề tài (Đã bị loại khỏi đợt)" : (resolvedThesisTitle != null ? resolvedThesisTitle : "Đề tài đồ án tốt nghiệp"))
                .eligibleForDefense(eligible)
                .thesisProgressPercentage(progressPercentage)
                .allProgressStagesCompleted(progressPercentage >= 100.0)
                .supervisorApproved(supervisorApproved)
                .supervisorScore(supervisorScoreOutput)
                .reviewerAssigned(reviewerAssigned)
                .reviewerScore(null)
                .plagiarismRate(0.0)
                .reasons(reasons)
                .hasPendingReservation(hasPendingReservation)
                .reservationId(reservationId)
                .reservationStatus(reservationStatus)
                .reservationCategory(reservationCategory)
                .reservationReason(reservationReason)
                .studentRoundStatus(studentRoundStatus)
                .completedCredits(academicRecord.getCompletedCredits())
                .missingPrerequisiteCount(academicRecord.getMissingPrerequisiteCount())
                .tuitionDebt(tuitionDebt)
                .build();
    }

    private ReservationResponseDTO mapToReservationResponse(ReservationRequest entity) {
        String studentCode = null;
        String studentName = null;
        String thesisTitle = null;
        String roundCode = null;
        String reviewerName = null;

        if (studentRepository != null && entity.getStudentId() != null) {
            Optional<Student> sOpt = studentRepository.findById(entity.getStudentId());
            if (sOpt.isPresent()) {
                Student s = sOpt.get();
                studentCode = s.getStudentCode();
                if (s.getUser() != null) {
                    studentName = s.getUser().getFullName();
                }
            }
        }
        if (studentCode == null) studentCode = "SV" + entity.getStudentId();
        if (studentName == null) studentName = "Sinh viên #" + entity.getStudentId();

        if (thesisRepository != null && entity.getThesisId() != null) {
            Optional<Thesis> tOpt = thesisRepository.findById(entity.getThesisId());
            if (tOpt.isPresent()) {
                thesisTitle = tOpt.get().getTitleVn();
            }
        }
        if (thesisTitle == null && thesisRepository != null && entity.getStudentId() != null) {
            Optional<Thesis> tOpt = thesisRepository.findAll().stream()
                    .filter(t -> t.getStudent() != null && Objects.equals(t.getStudent().getId(), entity.getStudentId()))
                    .max(Comparator.comparing(Thesis::getId));
            if (tOpt.isPresent()) {
                thesisTitle = tOpt.get().getTitleVn();
            }
        }
        if (thesisTitle == null) {
            thesisTitle = "Đề tài đồ án tốt nghiệp";
        }

        if (projectRoundRepository != null && entity.getProjectRoundId() != null) {
            Optional<ProjectRound> prOpt = projectRoundRepository.findById(entity.getProjectRoundId());
            if (prOpt.isPresent()) {
                roundCode = prOpt.get().getRoundCode();
            }
        }
        if (roundCode == null) {
            roundCode = "Đợt #" + entity.getProjectRoundId();
        }

        if (userRepository != null && entity.getReviewedBy() != null) {
            Optional<User> uOpt = userRepository.findById(entity.getReviewedBy());
            if (uOpt.isPresent()) {
                reviewerName = uOpt.get().getFullName();
            }
        }
        if (reviewerName == null && entity.getReviewedBy() != null) {
            reviewerName = "Cán bộ ID: " + entity.getReviewedBy();
        }

        return ReservationResponseDTO.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .studentCode(studentCode)
                .studentName(studentName)
                .thesisId(entity.getThesisId())
                .thesisTitle(thesisTitle)
                .projectRoundId(entity.getProjectRoundId())
                .roundCode(roundCode)
                .reasonCategory(entity.getReasonCategory())
                .reason(entity.getReason())
                .evidenceFileUrl(entity.getEvidenceFileUrl())
                .evidenceFileName(entity.getEvidenceFileName())
                .supervisorApproved(entity.getSupervisorApproved())
                .supervisorComment(entity.getSupervisorComment())
                .targetRoundCode(entity.getTargetRoundCode())
                .status(entity.getStatus())
                .submittedAt(entity.getSubmittedAt())
                .reviewedBy(entity.getReviewedBy())
                .reviewerName(reviewerName)
                .reviewedAt(entity.getReviewedAt())
                .rejectionReason(entity.getRejectionReason())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
