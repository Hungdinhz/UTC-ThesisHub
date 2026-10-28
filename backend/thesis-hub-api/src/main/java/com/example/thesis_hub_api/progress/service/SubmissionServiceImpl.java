package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.progress.dto.CreateSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.ReviewSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.SubmissionResponse;
import com.example.thesis_hub_api.progress.entity.Submission;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.progress.repository.SubmissionRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import com.example.thesis_hub_api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final TaskRepository taskRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public SubmissionResponse submitTask(Long taskId, CreateSubmissionRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        Student student = null;
        if (request.getStudentId() != null) {
            student = studentRepository.findById(request.getStudentId())
                    .orElseGet(() -> studentRepository.findByUserId(request.getStudentId()).orElse(null));
        }
        if (student == null && task.getThesis() != null && task.getThesis().getStudent() != null) {
            student = task.getThesis().getStudent();
        }
        if (student == null) {
            throw new ResourceNotFoundException("Student", request.getStudentId());
        }

        boolean isReviseTask = "REVISE".equalsIgnoreCase(task.getStatus()) || "REVISE_REQUIRED".equalsIgnoreCase(task.getStatus());

        Submission submission = Submission.builder()
                .task(task)
                .student(student)
                .title(request.getTitle() != null ? request.getTitle() : (isReviseTask ? "[Đã sửa bài] " + task.getTitle() : "Nộp bài cho công việc: " + task.getTitle()))
                .submissionContent(request.getSubmissionContent())
                .fileUrl(request.getFileUrl())
                .status("SUBMITTED")
                .submittedAt(Instant.now())
                .build();

        Submission saved = submissionRepository.save(submission);

        // Nếu task đang ở cột REVISE (Cần sửa), giữ nguyên ở cột REVISE để hiển thị trạng thái "Đã sửa" màu xanh
        if (!isReviseTask) {
            task.setStatus("SUBMITTED");
            taskRepository.save(task);
        }

        // Gửi thông báo cho GVHD người tạo task
        if (task.getCreatedBy() != null && task.getCreatedBy().getId() != null) {
            try {
                String studentName = (student.getUser() != null && student.getUser().getFullName() != null)
                        ? student.getUser().getFullName()
                        : ("Sinh viên mã " + student.getStudentCode());
                notificationService.createNotification(
                        task.getCreatedBy().getId(),
                        "Sinh viên nộp bài: " + task.getTitle(),
                        studentName + " vừa nộp báo cáo cho nhiệm vụ \"" + task.getTitle() + "\".",
                        "TASK_SUBMISSION",
                        "/progress/tasks"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo nộp bài cho Task {}: {}", taskId, e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SubmissionResponse reviewSubmission(Long submissionId, ReviewSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));

        submission.setStatus(request.getStatus());
        submission.setReviewFeedback(request.getReviewFeedback());
        submission.setReviewedAt(Instant.now());

        Task task = submission.getTask();
        if ("ACCEPTED".equalsIgnoreCase(request.getStatus())) {
            task.setStatus("COMPLETED");
            task.setCompletedAt(Instant.now());
        } else if ("REVISE_REQUIRED".equalsIgnoreCase(request.getStatus())) {
            task.setStatus("REVISE");
        }
        taskRepository.save(task);

        Submission updatedSubmission = submissionRepository.save(submission);

        // Gửi thông báo kết quả review cho Sinh viên
        if (submission.getStudent() != null && submission.getStudent().getUser() != null && submission.getStudent().getUser().getId() != null) {
            try {
                String decision = "ACCEPTED".equalsIgnoreCase(request.getStatus()) ? "ĐẠT" : "CẦN CHỈNH SỬA";
                String feedback = (request.getReviewFeedback() != null && !request.getReviewFeedback().isBlank())
                        ? (": " + request.getReviewFeedback())
                        : ".";
                notificationService.createNotification(
                        submission.getStudent().getUser().getId(),
                        "Đánh giá nhiệm vụ: " + task.getTitle() + " [" + decision + "]",
                        "GVHD đã đánh giá kết quả nhiệm vụ \"" + task.getTitle() + "\": " + decision + feedback,
                        "TASK_REVIEW",
                        "/progress/tasks"
                );
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo đánh giá bài nộp {}: {}", submissionId, e.getMessage());
            }
        }

        return mapToResponse(updatedSubmission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByTask(Long taskId) {
        return submissionRepository.findByTaskIdOrderBySubmittedAtDesc(taskId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionById(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));
        return mapToResponse(submission);
    }

    private SubmissionResponse mapToResponse(Submission s) {
        String studentName = s.getStudent().getUser() != null ? s.getStudent().getUser().getFullName() : null;

        return SubmissionResponse.builder()
                .id(s.getId())
                .taskId(s.getTask().getId())
                .taskTitle(s.getTask().getTitle())
                .studentId(s.getStudent().getId())
                .studentCode(s.getStudent().getStudentCode())
                .studentFullName(studentName)
                .title(s.getTitle())
                .submissionContent(s.getSubmissionContent())
                .fileUrl(s.getFileUrl())
                .status(s.getStatus())
                .reviewFeedback(s.getReviewFeedback())
                .reviewedAt(s.getReviewedAt())
                .submittedAt(s.getSubmittedAt())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
