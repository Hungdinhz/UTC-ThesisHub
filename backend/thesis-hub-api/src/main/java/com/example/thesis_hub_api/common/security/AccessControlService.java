package com.example.thesis_hub_api.common.security;

import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.progress.entity.Comment;
import com.example.thesis_hub_api.progress.entity.ProgressReport;
import com.example.thesis_hub_api.progress.entity.Submission;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.progress.repository.CommentRepository;
import com.example.thesis_hub_api.progress.repository.ProgressReportRepository;
import com.example.thesis_hub_api.progress.repository.SubmissionRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import com.example.thesis_hub_api.thesis.entity.Document;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.DocumentRepository;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

@Component("accessControl")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccessControlService {

    private static final Set<String> STAFF_AND_LECTURER_ROLES = Set.of(
            "ROLE_ADMIN",
            "ROLE_ACADEMIC_STAFF",
            "ROLE_FACULTY_ADMIN",
            "ROLE_LECTURER",
            "ROLE_COMMITTEE",
            "ROLE_EXTERNAL"
    );

    private final ThesisRepository thesisRepository;
    private final ProposalRepository proposalRepository;
    private final DocumentRepository documentRepository;
    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;
    private final ProgressReportRepository progressReportRepository;
    private final CommentRepository commentRepository;
    private final StudentRepository studentRepository;

    public UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    public Long getCurrentUserId() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null ? principal.getId() : null;
    }

    public boolean isStaffOrLecturer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if (STAFF_AND_LECTURER_ROLES.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    public boolean isAdminOrAcademicStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_ADMIN".equals(role) || "ROLE_ACADEMIC_STAFF".equals(role) || "ROLE_FACULTY_ADMIN".equals(role)) {
                return true;
            }
        }
        return false;
    }

    public boolean isStudentOwnerOrStaff(Long studentOrUserId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return false;
        }
        if (studentOrUserId == null || currentUserId.equals(studentOrUserId)) {
            return true;
        }
        Optional<Student> studentOpt = studentRepository.findByUserId(currentUserId);
        return studentOpt.isPresent() && studentOpt.get().getId().equals(studentOrUserId);
    }

    public boolean canAccessThesis(Long thesisId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || thesisId == null) {
            return false;
        }
        Optional<Thesis> thesisOpt = thesisRepository.findById(thesisId);
        if (thesisOpt.isEmpty()) {
            return true; // Let service throw ResourceNotFoundException (404)
        }
        Thesis thesis = thesisOpt.get();
        return thesis.getStudent() != null
                && thesis.getStudent().getUser() != null
                && currentUserId.equals(thesis.getStudent().getUser().getId());
    }

    public boolean canAccessProposal(Long proposalId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || proposalId == null) {
            return false;
        }
        Optional<Proposal> proposalOpt = proposalRepository.findById(proposalId);
        if (proposalOpt.isEmpty()) {
            return true;
        }
        Proposal proposal = proposalOpt.get();
        return proposal.getStudent() != null
                && proposal.getStudent().getUser() != null
                && currentUserId.equals(proposal.getStudent().getUser().getId());
    }

    public boolean canAccessDocument(Long documentId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || documentId == null) {
            return false;
        }
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isEmpty()) {
            return true;
        }
        Document doc = docOpt.get();
        if (doc.getUploader() != null && currentUserId.equals(doc.getUploader().getId())) {
            return true;
        }
        return doc.getThesis() != null && canAccessThesis(doc.getThesis().getId());
    }

    public boolean canAccessTask(Long taskId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || taskId == null) {
            return false;
        }
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return true;
        }
        Task task = taskOpt.get();
        if (task.getAssignedTo() != null && currentUserId.equals(task.getAssignedTo().getId())) {
            return true;
        }
        return task.getThesis() != null && canAccessThesis(task.getThesis().getId());
    }

    public boolean canAccessSubmission(Long submissionId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || submissionId == null) {
            return false;
        }
        Optional<Submission> subOpt = submissionRepository.findById(submissionId);
        if (subOpt.isEmpty()) {
            return true;
        }
        Submission sub = subOpt.get();
        if (sub.getStudent() != null && sub.getStudent().getUser() != null
                && currentUserId.equals(sub.getStudent().getUser().getId())) {
            return true;
        }
        return sub.getTask() != null && canAccessTask(sub.getTask().getId());
    }

    public boolean canAccessProgressReport(Long reportId) {
        if (isStaffOrLecturer()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || reportId == null) {
            return false;
        }
        Optional<ProgressReport> reportOpt = progressReportRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            return true;
        }
        ProgressReport report = reportOpt.get();
        return report.getThesis() != null && canAccessThesis(report.getThesis().getId());
    }

    public boolean canDeleteComment(Long commentId) {
        if (isAdminOrAcademicStaff()) {
            return true;
        }
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null || commentId == null) {
            return false;
        }
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            return true;
        }
        Comment comment = commentOpt.get();
        return comment.getUser() != null && currentUserId.equals(comment.getUser().getId());
    }
}
