package com.example.thesis_hub_api.eligibility.service;

import com.example.thesis_hub_api.defense.entity.Score;
import com.example.thesis_hub_api.defense.repository.ReviewerAssignmentRepository;
import com.example.thesis_hub_api.defense.repository.ScoreRepository;
import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import com.example.thesis_hub_api.eligibility.repository.ReservationRequestRepository;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService.StudentAcademicRecord;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.AcademicRecord;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.AcademicRecordRepository;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
                        .thesisProgressPercentage(100.0)
                        .supervisorApprovedForDefense(true)
                        .build();
            }
        }

        StudentAcademicRecord mockRecord = academicMockService.getRecord(studentId);
        if (studentRepository != null && studentId != null) {
            studentRepository.findById(studentId).ifPresent(s -> {
                if (s.getStudentCode() != null && !s.getStudentCode().isBlank()) {
                    mockRecord.setStudentCode(s.getStudentCode());
                }
                if (s.getUser() != null && s.getUser().getFullName() != null && !s.getUser().getFullName().isBlank()) {
                    mockRecord.setFullName(s.getUser().getFullName());
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

        if (record.getCompletedCredits() < 110) {
            eligible = false;
            reasons.add("Số tín chỉ tích lũy chưa đạt chuẩn (Yêu cầu >= 110 tín chỉ, hiện có: " + record.getCompletedCredits() + ")");
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
                if ("DROPPED".equalsIgnoreCase(spr.getStatus()) || "DISQUALIFIED".equalsIgnoreCase(spr.getStatus())) {
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
     * Submit a reservation request (DONBAOLUU).
     */
    @Transactional
    public ReservationResponseDTO submitReservation(ReservationSubmitRequestDTO request) {
        Optional<ReservationRequest> pendingOpt = reservationRepository.findByStudentIdAndStatus(request.getStudentId(), "PENDING");
        if (pendingOpt.isPresent()) {
            throw new IllegalStateException("Sinh viên đã có một đơn bảo lưu đang chờ xét duyệt");
        }

        ReservationRequest entity = ReservationRequest.builder()
                .studentId(request.getStudentId())
                .thesisId(request.getThesisId())
                .projectRoundId(request.getProjectRoundId())
                .reason(request.getReason())
                .note(request.getNote())
                .status("PENDING")
                .submittedAt(Instant.now())
                .build();

        ReservationRequest saved = reservationRepository.save(entity);
        return mapToReservationResponse(saved);
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

        if (studentProjectRoundRepository != null && entity.getStudentId() != null && entity.getProjectRoundId() != null) {
            studentProjectRoundRepository.findByStudentIdAndProjectRoundId(entity.getStudentId(), entity.getProjectRoundId())
                    .ifPresent(spr -> {
                        if ("APPROVED".equalsIgnoreCase(targetStatus)) {
                            spr.setStatus("RESERVED");
                            spr.setNote("Bảo lưu đã được duyệt");
                        } else if ("REJECTED".equalsIgnoreCase(targetStatus)) {
                            spr.setStatus("DROPPED");
                            spr.setNote("Từ chối bảo lưu: " + (request.getRejectionReason() != null ? request.getRejectionReason() : ""));
                        }
                        studentProjectRoundRepository.save(spr);
                    });
        }

        ReservationRequest updated = reservationRepository.save(entity);
        return mapToReservationResponse(updated);
    }

    public List<ReservationResponseDTO> getReservations(Long studentId, Long projectRoundId, String status) {
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

        return list.stream().map(this::mapToReservationResponse).collect(Collectors.toList());
    }

    public ReservationResponseDTO getReservationById(Long id) {
        ReservationRequest entity = reservationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy đơn bảo lưu ID: " + id));
        return mapToReservationResponse(entity);
    }

    /**
     * Check if student / thesis is eligible for final defense council evaluation.
     */
    @Transactional(readOnly = true)
    public FinalDefenseEligibilityResponseDTO checkFinalDefenseEligibility(Long thesisId, Long studentId) {
        double progressPercentage;
        boolean supervisorApproved;

        Optional<Thesis> dbThesisOpt = (thesisRepository != null && thesisId != null)
                ? thesisRepository.findById(thesisId)
                : Optional.empty();

        if (dbThesisOpt.isPresent()) {
            Thesis t = dbThesisOpt.get();
            progressPercentage = t.getCompletionRate() != null ? t.getCompletionRate().doubleValue() : 0.0;
            supervisorApproved = Boolean.TRUE.equals(t.getDefenseEligible());
            if (studentId == null && t.getStudent() != null) {
                studentId = t.getStudent().getId();
            }
        } else {
            StudentAcademicRecord record = academicMockService.getRecord(studentId != null ? studentId : 101L);
            progressPercentage = record.getThesisProgressPercentage();
            supervisorApproved = record.isSupervisorApprovedForDefense();
        }

        List<String> reasons = new ArrayList<>();
        boolean eligible = true;

        if (progressPercentage < 100.0) {
            eligible = false;
            reasons.add("Tiến độ thực hiện đồ án chưa hoàn tất (Hiện tại: " + progressPercentage + "%)");
        }

        if (!supervisorApproved) {
            eligible = false;
            reasons.add("Giảng viên hướng dẫn chưa đồng ý cho sinh viên bảo vệ");
        }

        BigDecimal supervisorScore = null;
        BigDecimal reviewerScore = null;
        boolean reviewerAssigned = false;

        if (thesisId != null) {
            reviewerAssigned = reviewerAssignmentRepository.existsByThesisId(thesisId);
            if (!reviewerAssigned) {
                eligible = false;
                reasons.add("Đề tài chưa được phân công Giảng viên phản biện");
            }

            List<Score> scores = scoreRepository.findByThesisId(thesisId);
            for (Score s : scores) {
                if ("SUPERVISOR".equalsIgnoreCase(s.getScoreType())) {
                    supervisorScore = s.getScore();
                } else if ("REVIEWER".equalsIgnoreCase(s.getScoreType())) {
                    reviewerScore = s.getScore();
                }
            }

            if (supervisorScore != null && supervisorScore.compareTo(BigDecimal.valueOf(5.0)) < 0) {
                eligible = false;
                reasons.add("Điểm đánh giá của GVHD dưới 5.0 (Điểm: " + supervisorScore + ")");
            }

            if (reviewerScore != null && reviewerScore.compareTo(BigDecimal.valueOf(5.0)) < 0) {
                eligible = false;
                reasons.add("Điểm đánh giá của GVPB dưới 5.0 (Điểm: " + reviewerScore + ")");
            }
        }

        if (eligible) {
            reasons.add("Đủ điều kiện tham gia Hội đồng bảo vệ đồ án tốt nghiệp");
        }

        return FinalDefenseEligibilityResponseDTO.builder()
                .studentId(studentId)
                .thesisId(thesisId)
                .eligibleForDefense(eligible)
                .thesisProgressPercentage(progressPercentage)
                .supervisorApproved(supervisorApproved)
                .supervisorScore(supervisorScore)
                .reviewerAssigned(reviewerAssigned)
                .reviewerScore(reviewerScore)
                .reasons(reasons)
                .build();
    }

    private ReservationResponseDTO mapToReservationResponse(ReservationRequest entity) {
        return ReservationResponseDTO.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .thesisId(entity.getThesisId())
                .projectRoundId(entity.getProjectRoundId())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .submittedAt(entity.getSubmittedAt())
                .reviewedBy(entity.getReviewedBy())
                .reviewedAt(entity.getReviewedAt())
                .rejectionReason(entity.getRejectionReason())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
