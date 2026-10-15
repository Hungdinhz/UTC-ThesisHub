package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.progress.dto.CommentResponse;
import com.example.thesis_hub_api.progress.dto.CreateCommentRequest;
import com.example.thesis_hub_api.progress.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/by-task/{taskId}")
    public ApiResponse<CommentResponse> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ApiResponse.success("Gửi bình luận thành công", commentService.addComment(taskId, request));
    }

    @GetMapping("/by-task/{taskId}")
    public ApiResponse<List<CommentResponse>> getCommentsByTask(@PathVariable Long taskId) {
        return ApiResponse.success(commentService.getCommentsByTask(taskId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ApiResponse.success("Xóa bình luận thành công", null);
    }
}
