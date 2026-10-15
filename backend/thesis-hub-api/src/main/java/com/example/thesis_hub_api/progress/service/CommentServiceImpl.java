package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.progress.dto.CommentResponse;
import com.example.thesis_hub_api.progress.dto.CreateCommentRequest;
import com.example.thesis_hub_api.progress.entity.Comment;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.progress.repository.CommentRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CommentResponse addComment(Long taskId, CreateCommentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId()).orElse(null);
        }

        Comment comment = Comment.builder()
                .task(task)
                .user(user)
                .parent(parent)
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .isEdited(false)
                .build();

        return mapToResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTask(Long taskId) {
        return commentRepository.findByTaskIdAndParentIsNullOrderByCreatedAtAsc(taskId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteComment(Long id) {
        if (!commentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Comment", id);
        }
        commentRepository.deleteById(id);
    }

    private CommentResponse mapToResponse(Comment c) {
        List<CommentResponse> replyDtos = c.getReplies() != null
                ? c.getReplies().stream().map(this::mapToResponse).collect(Collectors.toList())
                : List.of();

        return CommentResponse.builder()
                .id(c.getId())
                .taskId(c.getTask().getId())
                .userId(c.getUser().getId())
                .userFullName(c.getUser().getFullName())
                .userAvatarUrl(c.getUser().getAvatarUrl())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .content(c.getContent())
                .attachmentUrl(c.getAttachmentUrl())
                .isEdited(c.getIsEdited())
                .replies(replyDtos)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
