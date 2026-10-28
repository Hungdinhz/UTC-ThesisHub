package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.DuplicateResourceException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.thesis.dto.*;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.entity.ProposalReviewAssignment;
import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ProposalReviewAssignmentRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProposalReviewAssignmentRepository reviewAssignmentRepository;
    private final ReviewGroupRepository reviewGroupRepository;
    private final ThesisRepository thesisRepository;
    private final ProjectRoundRepository projectRoundRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final com.example.thesis_hub_api.notification.service.NotificationService notificationService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository supervisorAssignmentRepository;

    @Override
    @Transactional
    public ProposalResponse createProposal(CreateProposalRequest request) {
        ProjectRound round = projectRoundRepository.findById(request.getProjectRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("ProjectRound", request.getProjectRoundId()));
        if ("CLOSED".equalsIgnoreCase(round.getStatus()) || "ARCHIVED".equalsIgnoreCase(round.getStatus())) {
            throw new AppException(ErrorCode.PROJECT_ROUND_CLOSED);
        }

        Student student = null;
        if (request.getStudentId() != null) {
            student = studentRepository.findById(request.getStudentId())
                    .orElseGet(() -> studentRepository.findByUserId(request.getStudentId())
                            .orElseGet(() -> studentRepository.findByStudentCode(String.valueOf(request.getStudentId()))
                                    .orElse(null)));
        }
        if (student == null) {
            throw new ResourceNotFoundException("Student", request.getStudentId());
        }

        // Kiểm tra sinh viên đã được phân công GVHD trong đợt đồ án chưa
        if (supervisorAssignmentRepository != null) {
            java.util.Optional<com.example.thesis_hub_api.assignment.entity.SupervisorAssignment> assignOpt =
                    supervisorAssignmentRepository.findByStudentIdAndProjectRoundId(student.getId(), request.getProjectRoundId());
            if (assignOpt.isEmpty() || assignOpt.get().getLecturerId() == null) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, "Sinh viên chưa được phân công giảng viên hướng dẫn trong đợt đồ án này nên không thể tạo đề cương.");
            }
        }

        Lecturer lecturer = null;
        if (request.getLecturerId() != null) {
            lecturer = lecturerRepository.findById(request.getLecturerId())
                    .orElseGet(() -> lecturerRepository.findByUserId(request.getLecturerId())
                            .orElseGet(() -> lecturerRepository.findByLecturerCode(String.valueOf(request.getLecturerId()))
                                    .orElse(null)));
        }
        if (lecturer == null) {
            throw new ResourceNotFoundException("Lecturer", request.getLecturerId());
        }

        java.util.Optional<Proposal> existingOpt = proposalRepository.findByStudentIdAndProjectRoundId(student.getId(), request.getProjectRoundId());
        if (existingOpt.isPresent()) {
            Proposal existing = existingOpt.get();
            if ("REVISE_REQUIRED".equals(existing.getStatus()) || "DRAFT".equals(existing.getStatus())) {
                existing.setLecturer(lecturer);
                existing.setTitleVn(request.getTitleVn());
                if (request.getTitleEn() != null) existing.setTitleEn(request.getTitleEn());
                if (request.getDescription() != null) existing.setDescription(request.getDescription());
                if (request.getObjectives() != null) existing.setObjectives(request.getObjectives());
                if (request.getExpectedResults() != null) existing.setExpectedResults(request.getExpectedResults());
                if (request.getResearchContent() != null) existing.setResearchContent(request.getResearchContent());
                if (request.getFileUrl() != null) existing.setFileUrl(request.getFileUrl());
                existing.setStatus("SUBMITTED");
                existing.setSubmittedAt(Instant.now());
                existing.setSupervisorApproved(false);
                existing.setVersion(existing.getVersion() + 1);
                Proposal updated = proposalRepository.save(existing);
                ensureThesisCreatedForProposal(updated);
                log.info("Updated & resubmitted proposal ID: {} for student: {}", updated.getId(), updated.getStudent().getStudentCode());
                return mapToResponse(updated);
            }
            throw new DuplicateResourceException("Sinh viên đã nộp đề cương trong đợt đồ án này (trạng thái: " + existing.getStatus() + ")");
        }

        Proposal proposal = Proposal.builder()
                .projectRound(round)
                .student(student)
                .lecturer(lecturer)
                .titleVn(request.getTitleVn())
                .titleEn(request.getTitleEn())
                .description(request.getDescription())
                .objectives(request.getObjectives())
                .expectedResults(request.getExpectedResults())
                .researchContent(request.getResearchContent())
                .fileUrl(request.getFileUrl())
                .status("SUBMITTED")
                .submittedAt(Instant.now())
                .supervisorApproved(false)
                .studentSigned(false)
                .version(1)
                .build();

        Proposal saved = proposalRepository.save(proposal);
        ensureThesisCreatedForProposal(saved);
        log.info("Created & submitted proposal with ID: {} for student: {}", saved.getId(), student.getStudentCode());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProposalResponse updateProposal(Long id, UpdateProposalRequest request) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", id));

        if (!"REVISE_REQUIRED".equals(proposal.getStatus())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Đề cương đã nộp không thể tự ý chỉnh sửa. Chỉ được phép chỉnh sửa khi Giảng viên hướng dẫn hoặc Khoa yêu cầu sửa đổi (REVISE_REQUIRED).");
        }

        if (request.getTitleVn() != null) proposal.setTitleVn(request.getTitleVn());
        if (request.getTitleEn() != null) proposal.setTitleEn(request.getTitleEn());
        if (request.getDescription() != null) proposal.setDescription(request.getDescription());
        if (request.getObjectives() != null) proposal.setObjectives(request.getObjectives());
        if (request.getExpectedResults() != null) proposal.setExpectedResults(request.getExpectedResults());
        if (request.getResearchContent() != null) proposal.setResearchContent(request.getResearchContent());
        if (request.getFileUrl() != null) proposal.setFileUrl(request.getFileUrl());

        proposal.setVersion(proposal.getVersion() + 1);
        proposal.setStatus("SUBMITTED");
        proposal.setSubmittedAt(Instant.now());
        proposal.setSupervisorApproved(false);

        Proposal saved = proposalRepository.save(proposal);
        ensureThesisCreatedForProposal(saved);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProposalResponse submitProposal(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", id));

        proposal.setStatus("SUBMITTED");
        proposal.setSubmittedAt(Instant.now());
        Proposal saved = proposalRepository.save(proposal);
        ensureThesisCreatedForProposal(saved);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProposalResponse supervisorApprove(Long id, boolean approved, String comment) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", id));

        proposal.setSupervisorApproved(approved);
        proposal.setSupervisorComment(comment);
        if (approved) {
            if (!"APPROVED".equalsIgnoreCase(proposal.getStatus())) {
                proposal.setStatus("UNDER_REVIEW");
            }
        } else {
            proposal.setStatus("REVISE_REQUIRED");
            proposal.setStudentSigned(false);
            proposal.setStudentSignedAt(null);
        }

        Proposal saved = proposalRepository.save(proposal);
        if (approved) {
            ensureThesisCreatedForProposal(saved);
        }

        // Gửi thông báo cho Sinh viên khi GVHD duyệt hoặc yêu cầu sửa
        if (saved.getStudent() != null && saved.getStudent().getUser() != null && saved.getStudent().getUser().getId() != null) {
            try {
                String actionText = approved ? "GVHD ĐÃ XÁC NHẬN" : "GVHD YÊU CẦU CHỈNH SỬA";
                String note = (comment != null && !comment.isBlank()) ? (": " + comment) : ".";
                notificationService.createNotification(
                        saved.getStudent().getUser().getId(),
                        "Đề cương: " + actionText,
                        "Giảng viên hướng dẫn đã phản hồi đề cương \"" + (saved.getTitleVn() != null ? saved.getTitleVn() : "Đồ án") + "\": " + actionText + note,
                        "PROPOSAL",
                        "/thesis/proposals"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo GVHD duyệt đề cương: {}", e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProposalResponse assignToReviewGroup(Long proposalId, Long reviewGroupId, Long assignedById) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", proposalId));

        ReviewGroup reviewGroup = reviewGroupRepository.findById(reviewGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("ReviewGroup", reviewGroupId));

        User assignedBy = null;
        if (assignedById != null) {
            assignedBy = userRepository.findById(assignedById).orElse(null);
        }

        java.util.List<ProposalReviewAssignment> existingList = reviewAssignmentRepository.findByProposalId(proposalId);
        ProposalReviewAssignment assignment = !existingList.isEmpty()
                ? existingList.get(0)
                : ProposalReviewAssignment.builder()
                        .proposal(proposal)
                        .reviewGroup(reviewGroup)
                        .build();

        assignment.setReviewGroup(reviewGroup);
        assignment.setAssignedBy(assignedBy);
        assignment.setAssignedAt(Instant.now());
        assignment.setStatus("PENDING");
        reviewAssignmentRepository.save(assignment);

        proposal.setStatus("ASSIGNED");
        return mapToResponse(proposalRepository.save(proposal));
    }

    @Override
    @Transactional
    public ProposalResponse reviewProposal(Long proposalId, ReviewProposalRequest request) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", proposalId));

        java.util.List<ProposalReviewAssignment> existingAssignments = reviewAssignmentRepository.findByProposalId(proposalId);
        ProposalReviewAssignment assignment;
        if (!existingAssignments.isEmpty()) {
            assignment = existingAssignments.get(0);
        } else {
            ReviewGroup rg = request.getReviewGroupId() != null
                    ? reviewGroupRepository.findById(request.getReviewGroupId()).orElse(null)
                    : null;
            if (rg == null) {
                java.util.List<ReviewGroup> groups = reviewGroupRepository.findByProjectRoundId(proposal.getProjectRound().getId());
                if (!groups.isEmpty()) {
                    rg = groups.get(0);
                } else {
                    rg = reviewGroupRepository.save(ReviewGroup.builder()
                            .projectRound(proposal.getProjectRound())
                            .code("RG_" + proposal.getProjectRound().getRoundCode() + "_" + System.currentTimeMillis() % 10000)
                            .name("Tiểu ban Xét duyệt Đề cương - " + proposal.getProjectRound().getName())
                            .description("Tiểu ban xét duyệt đề cương đợt đồ án")
                            .status("ACTIVE")
                            .build());
                }
            }
            assignment = ProposalReviewAssignment.builder()
                    .proposal(proposal)
                    .reviewGroup(rg)
                    .assignedAt(Instant.now())
                    .status("PENDING")
                    .build();
        }

        assignment.setStatus(request.getStatus());
        assignment.setEvaluationNotes(request.getEvaluationNotes());
        assignment.setDecisionDate(Instant.now());
        reviewAssignmentRepository.save(assignment);

        proposal.setStatus(request.getStatus());
        if ("APPROVED".equalsIgnoreCase(request.getStatus())) {
            proposal.setSupervisorApproved(true);
        } else if ("REVISE_REQUIRED".equalsIgnoreCase(request.getStatus()) || "REJECTED".equalsIgnoreCase(request.getStatus())) {
            proposal.setSupervisorApproved(false);
            proposal.setStudentSigned(false);
            proposal.setStudentSignedAt(null);
        }
        Proposal savedProposal = proposalRepository.save(proposal);

        // Auto-generate official Thesis when Proposal is APPROVED
        if ("APPROVED".equalsIgnoreCase(request.getStatus())) {
            ensureThesisCreatedForProposal(savedProposal);
        }

        // Gửi thông báo kết quả xét duyệt đề cương cho Sinh viên
        if (savedProposal.getStudent() != null && savedProposal.getStudent().getUser() != null && savedProposal.getStudent().getUser().getId() != null) {
            try {
                String decisionText = "APPROVED".equalsIgnoreCase(request.getStatus()) ? "ĐÃ ĐƯỢC PHÊ DUYỆT" : "YÊU CẦU CHỈNH SỬA";
                String note = (request.getEvaluationNotes() != null && !request.getEvaluationNotes().isBlank())
                        ? (": " + request.getEvaluationNotes())
                        : ".";
                notificationService.createNotification(
                        savedProposal.getStudent().getUser().getId(),
                        "Kết quả duyệt đề cương: " + decisionText,
                        "Đề cương đề tài \"" + (savedProposal.getTitleVn() != null ? savedProposal.getTitleVn() : "Đồ án") + "\" của bạn: " + decisionText + note,
                        "PROPOSAL",
                        "/thesis/proposals"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo duyệt đề cương {}: {}", proposalId, e.getMessage());
            }
        }

        return mapToResponse(savedProposal);
    }

    @Override
    @Transactional
    public ProposalResponse signProposal(Long id, Long currentUserId) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", id));

        if (!"APPROVED".equalsIgnoreCase(proposal.getStatus())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Chỉ đề cương đã được Khoa phê duyệt (APPROVED) mới có thể ký nộp lưu hồ sơ.");
        }

        if (currentUserId != null && studentRepository != null) {
            java.util.Optional<Student> callerStudent = studentRepository.findByUserId(currentUserId);
            if (callerStudent.isPresent() && !callerStudent.get().getId().equals(proposal.getStudent().getId())) {
                throw new AppException(ErrorCode.UNAUTHORIZED, "Sinh viên chỉ được phép ký đề cương của chính mình.");
            }
        }

        proposal.setStudentSigned(true);
        proposal.setStudentSignedAt(Instant.now());
        Proposal saved = proposalRepository.save(proposal);

        if (saved.getLecturer() != null && saved.getLecturer().getUser() != null && saved.getLecturer().getUser().getId() != null) {
            try {
                String studentName = saved.getStudent() != null && saved.getStudent().getUser() != null
                        ? saved.getStudent().getUser().getFullName()
                        : "Sinh viên";
                notificationService.createNotification(
                        saved.getLecturer().getUser().getId(),
                        "SV đã ký nộp đề cương",
                        studentName + " đã ký xác nhận nộp đề cương \"" + (saved.getTitleVn() != null ? saved.getTitleVn() : "Đồ án") + "\".",
                        "PROPOSAL",
                        "/thesis/proposals"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo SV ký đề cương: {}", e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    private void ensureThesisCreatedForProposal(Proposal proposal) {
        if (proposal == null || proposal.getStudent() == null || proposal.getProjectRound() == null || proposal.getLecturer() == null) {
            return;
        }
        if ("REJECTED".equalsIgnoreCase(proposal.getStatus())) {
            return;
        }
        java.util.Optional<Thesis> existingThesisOpt = thesisRepository.findByStudentIdAndProjectRoundId(
                proposal.getStudent().getId(),
                proposal.getProjectRound().getId()
        );
        if (existingThesisOpt.isPresent()) {
            Thesis existingThesis = existingThesisOpt.get();
            existingThesis.setProposal(proposal);
            existingThesis.setLecturer(proposal.getLecturer());
            existingThesis.setTitleVn(proposal.getTitleVn());
            existingThesis.setTitleEn(proposal.getTitleEn());
            existingThesis.setDescription(proposal.getDescription());
            existingThesis.setObjectives(proposal.getObjectives());
            thesisRepository.save(existingThesis);
            return;
        }

        String roundCode = proposal.getProjectRound().getRoundCode();
        String studentCode = proposal.getStudent().getStudentCode();
        String thesisCode = "DT_" + roundCode + "_" + studentCode;

        Thesis thesis = Thesis.builder()
                .proposal(proposal)
                .projectRound(proposal.getProjectRound())
                .student(proposal.getStudent())
                .lecturer(proposal.getLecturer())
                .thesisCode(thesisCode)
                .titleVn(proposal.getTitleVn())
                .titleEn(proposal.getTitleEn())
                .description(proposal.getDescription())
                .objectives(proposal.getObjectives())
                .status("IN_PROGRESS")
                .completionRate(BigDecimal.ZERO)
                .defenseEligible(false)
                .build();

        thesisRepository.save(thesis);
        log.info("Auto-created official thesis {} for proposal {}", thesisCode, proposal.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ProposalResponse getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", id));
        return mapToResponse(proposal);
    }

    @Override
    @Transactional(readOnly = true)
    public ProposalResponse getProposalByStudentAndRound(Long studentId, Long roundId) {
        Long resolvedStudentId = resolveStudentId(studentId);
        Proposal proposal = proposalRepository.findByStudentIdAndProjectRoundId(resolvedStudentId, roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề cương không tồn tại cho sinh viên và đợt này"));
        return mapToResponse(proposal);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProposalResponse> searchProposals(Long roundId, Long lecturerId, String status, String search, Pageable pageable) {
        return searchProposals(roundId, lecturerId, null, status, search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProposalResponse> searchProposals(Long roundId, Long lecturerId, Long studentId, String status, String search, Pageable pageable) {
        Long resolvedStudentId = resolveStudentId(studentId);
        Long resolvedLecturerId = resolveLecturerId(lecturerId);
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        return proposalRepository.searchProposals(roundId, resolvedLecturerId, resolvedStudentId, status, searchPattern, pageable)
                .map(this::mapToResponse);
    }

    private Long resolveStudentId(Long studentId) {
        if (studentId == null || studentRepository == null) return studentId;
        if (studentRepository.existsById(studentId)) return studentId;
        return studentRepository.findByUserId(studentId).map(Student::getId).orElse(studentId);
    }

    private Long resolveLecturerId(Long lecturerId) {
        if (lecturerId == null || lecturerRepository == null) return lecturerId;
        if (lecturerRepository.existsById(lecturerId)) return lecturerId;
        return lecturerRepository.findByUserId(lecturerId).map(Lecturer::getId).orElse(lecturerId);
    }

    private ProposalResponse mapToResponse(Proposal proposal) {
        String studentName = proposal.getStudent().getUser() != null ? proposal.getStudent().getUser().getFullName() : null;
        String lecturerName = proposal.getLecturer().getUser() != null ? proposal.getLecturer().getUser().getFullName() : null;

        return ProposalResponse.builder()
                .id(proposal.getId())
                .projectRoundId(proposal.getProjectRound().getId())
                .projectRoundName(proposal.getProjectRound().getName())
                .studentId(proposal.getStudent().getId())
                .studentCode(proposal.getStudent().getStudentCode())
                .studentFullName(studentName)
                .studentClass(proposal.getStudent().getClassName())
                .lecturerId(proposal.getLecturer().getId())
                .lecturerCode(proposal.getLecturer().getLecturerCode())
                .lecturerFullName(lecturerName)
                .lecturerDegree(proposal.getLecturer().getAcademicDegree())
                .titleVn(proposal.getTitleVn())
                .titleEn(proposal.getTitleEn())
                .description(proposal.getDescription())
                .objectives(proposal.getObjectives())
                .expectedResults(proposal.getExpectedResults())
                .researchContent(proposal.getResearchContent())
                .fileUrl(proposal.getFileUrl())
                .status(proposal.getStatus())
                .supervisorApproved(proposal.getSupervisorApproved())
                .supervisorComment(proposal.getSupervisorComment())
                .version(proposal.getVersion())
                .submittedAt(proposal.getSubmittedAt())
                .studentSigned(Boolean.TRUE.equals(proposal.getStudentSigned()))
                .studentSignedAt(proposal.getStudentSignedAt())
                .createdAt(proposal.getCreatedAt())
                .updatedAt(proposal.getUpdatedAt())
                .build();
    }
}
