package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.progress.dto.CreateSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.ReviewSubmissionRequest;
import com.example.thesis_hub_api.progress.dto.SubmissionResponse;
import com.example.thesis_hub_api.progress.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/by-task/{taskId}")
    public ApiResponse<SubmissionResponse> submitTask(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateSubmissionRequest request) {
        return ApiResponse.success("Nộp bài thực hiện công việc thành công",
                submissionService.submitTask(taskId, request));
    }

    @PostMapping("/{id}/review")
    public ApiResponse<SubmissionResponse> reviewSubmission(
            @PathVariable Long id,
            @Valid @RequestBody ReviewSubmissionRequest request) {
        return ApiResponse.success("Đánh giá bài nộp thành công",
                submissionService.reviewSubmission(id, request));
    }

    @GetMapping("/by-task/{taskId}")
    public ApiResponse<List<SubmissionResponse>> getSubmissionsByTask(@PathVariable Long taskId) {
        return ApiResponse.success(submissionService.getSubmissionsByTask(taskId));
    }

    @GetMapping("/{id}")
    public ApiResponse<SubmissionResponse> getSubmissionById(@PathVariable Long id) {
        return ApiResponse.success(submissionService.getSubmissionById(id));
    }
}
