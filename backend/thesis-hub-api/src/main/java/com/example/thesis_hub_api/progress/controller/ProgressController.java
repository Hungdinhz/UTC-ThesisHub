package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.progress.dto.*;
import com.example.thesis_hub_api.progress.service.ProgressReportService;
import com.example.thesis_hub_api.progress.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProgressController {

    private final TaskService taskService;
    private final ProgressReportService reportService;

    // --- Tasks ---
    @PostMapping("/tasks")
    public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskCreateDTO request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(@PathVariable Long id, @RequestBody TaskUpdateDTO request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskResponseDTO>> getTasks(@RequestParam Long thesisId) {
        return ResponseEntity.ok(taskService.getTasksByThesis(thesisId));
    }

    // --- Submissions ---
    @PostMapping("/tasks/{id}/submit")
    public ResponseEntity<SubmissionResponseDTO> submitTask(@PathVariable Long id, @RequestBody SubmissionCreateDTO request) {
        return ResponseEntity.ok(taskService.submitTask(id, request));
    }

    @PutMapping("/submissions/{id}/review")
    public ResponseEntity<SubmissionResponseDTO> reviewSubmission(@PathVariable Long id, @RequestBody SubmissionReviewDTO request) {
        return ResponseEntity.ok(taskService.reviewSubmission(id, request));
    }

    // --- Comments ---
    @PostMapping("/tasks/{id}/comments")
    public ResponseEntity<CommentResponseDTO> addComment(@PathVariable Long id, @RequestBody CommentCreateDTO request) {
        return ResponseEntity.ok(taskService.addComment(id, request));
    }

    @GetMapping("/tasks/{id}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getCommentsByTask(id));
    }

    // --- Progress Reports ---
    @PostMapping("/progress-reports")
    public ResponseEntity<ProgressReportResponseDTO> createReport(@RequestBody ProgressReportCreateDTO request) {
        return ResponseEntity.ok(reportService.createReport(request));
    }

    @GetMapping("/progress-reports")
    public ResponseEntity<List<ProgressReportResponseDTO>> getReports(@RequestParam Long thesisId) {
        return ResponseEntity.ok(reportService.getReportsByThesis(thesisId));
    }

    @PostMapping("/progress-reports/{id}/feedback")
    public ResponseEntity<ProgressFeedbackResponseDTO> addFeedback(@PathVariable Long id, @RequestBody ProgressFeedbackCreateDTO request) {
        return ResponseEntity.ok(reportService.addFeedback(id, request));
    }
}
