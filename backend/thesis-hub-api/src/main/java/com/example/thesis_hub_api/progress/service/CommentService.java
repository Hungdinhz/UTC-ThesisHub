package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.CommentResponse;
import com.example.thesis_hub_api.progress.dto.CreateCommentRequest;

import java.util.List;

public interface CommentService {

    CommentResponse addComment(Long taskId, CreateCommentRequest request);

    List<CommentResponse> getCommentsByTask(Long taskId);

    void deleteComment(Long id);
}
