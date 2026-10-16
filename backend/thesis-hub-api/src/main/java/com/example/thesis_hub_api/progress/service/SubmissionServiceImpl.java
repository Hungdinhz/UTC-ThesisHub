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

    @Override
    @Transactional
    public SubmissionResponse submitTask(Long taskId, CreateSubmissionRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        Submission submission = Submission.builder()
                .task(task)
                .student(student)
                .title(request.getTitle() != null ? request.getTitle() : "Nộp bài cho công việc: " + task.getTitle())
                .submissionContent(request.getSubmissionContent())
                .fileUrl(request.getFileUrl())
                .status("SUBMITTED")
                .submittedAt(Instant.now())
                .build();

        Submission saved = submissionRepository.save(submission);

        // Update task status to SUBMITTED
        task.setStatus("SUBMITTED");
        taskRepository.save(task);

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

        return mapToResponse(submissionRepository.save(submission));
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
