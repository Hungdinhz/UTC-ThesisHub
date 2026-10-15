package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.*;
import com.example.thesis_hub_api.thesis.entity.Comment;
import com.example.thesis_hub_api.progress.entity.Submission;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.thesis.repository.CommentRepository;
import com.example.thesis_hub_api.progress.repository.SubmissionRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;
    private final CommentRepository commentRepository;
    private final ExternalAssignmentMockService mockService;

    @Transactional
    public TaskResponseDTO createTask(TaskCreateDTO request) {
        Task task = Task.builder()
                .thesisId(request.getThesisId())
                .assigneeId(request.getAssigneeId())
                .assignerId(request.getAssignerId())
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status("TODO")
                .build();
        
        Task saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    @Transactional
    public TaskResponseDTO updateTask(Long id, TaskUpdateDTO request) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        return mapToResponse(taskRepository.save(task));
    }

    public List<TaskResponseDTO> getTasksByThesis(Long thesisId) {
        return taskRepository.findByThesisId(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubmissionResponseDTO submitTask(Long id, SubmissionCreateDTO request) {
        Task task = taskRepository.findById(id).orElseThrow();
        
        Submission submission = Submission.builder()
                .taskId(task.getId())
                .studentId(request.getStudentId())
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .submittedAt(Instant.now())
                .status("PENDING")
                .build();
                
        Submission saved = submissionRepository.save(submission);
        
        task.setStatus("SUBMITTED");
        taskRepository.save(task);
        
        return mapToSubmissionResponse(saved);
    }

    @Transactional
    public SubmissionResponseDTO reviewSubmission(Long submissionId, SubmissionReviewDTO request) {
        Submission submission = submissionRepository.findById(submissionId).orElseThrow();
        submission.setStatus(request.getStatus());
        submission.setFeedback(request.getFeedback());
        submission.setReviewedAt(Instant.now());
        
        Submission saved = submissionRepository.save(submission);
        
        Task task = taskRepository.findById(submission.getTaskId()).orElseThrow();
        if ("ACCEPTED".equals(request.getStatus())) {
            task.setStatus("COMPLETED");
        } else if ("REJECTED".equals(request.getStatus())) {
            task.setStatus("REVISION_REQUIRED");
        }
        taskRepository.save(task);
        
        return mapToSubmissionResponse(saved);
    }

    @Transactional
    public CommentResponseDTO addComment(Long taskId, CommentCreateDTO request) {
        Comment comment = Comment.builder()
                .taskId(taskId)
                .submissionId(request.getSubmissionId())
                .authorId(request.getAuthorId())
                .content(request.getContent())
                .build();
                
        Comment saved = commentRepository.save(comment);
        return mapToCommentResponse(saved);
    }

    public List<CommentResponseDTO> getCommentsByTask(Long taskId) {
        return commentRepository.findByTaskId(taskId).stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    private TaskResponseDTO mapToResponse(Task task) {
        String assigneeName = mockService.getStudent(task.getAssigneeId())
                .map(ExternalAssignmentMockService.MockStudent::getFullName)
                .orElse("Student " + task.getAssigneeId());
                
        String assignerName = mockService.getLecturer(task.getAssignerId())
                .map(ExternalAssignmentMockService.MockLecturer::getFullName)
                .orElse("Lecturer " + task.getAssignerId());

        return TaskResponseDTO.builder()
                .id(task.getId())
                .thesisId(task.getThesisId())
                .assigneeId(task.getAssigneeId())
                .assigneeName(assigneeName)
                .assignerId(task.getAssignerId())
                .assignerName(assignerName)
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private SubmissionResponseDTO mapToSubmissionResponse(Submission s) {
        String studentName = mockService.getStudent(s.getStudentId())
                .map(ExternalAssignmentMockService.MockStudent::getFullName)
                .orElse("Student " + s.getStudentId());

        return SubmissionResponseDTO.builder()
                .id(s.getId())
                .taskId(s.getTaskId())
                .studentId(s.getStudentId())
                .studentName(studentName)
                .content(s.getContent())
                .fileUrl(s.getFileUrl())
                .submittedAt(s.getSubmittedAt())
                .status(s.getStatus())
                .feedback(s.getFeedback())
                .reviewedAt(s.getReviewedAt())
                .build();
    }

    private CommentResponseDTO mapToCommentResponse(Comment c) {
        String authorName = "User " + c.getAuthorId(); // Should resolve based on user type

        return CommentResponseDTO.builder()
                .id(c.getId())
                .taskId(c.getTaskId())
                .submissionId(c.getSubmissionId())
                .authorId(c.getAuthorId())
                .authorName(authorName)
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
