package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {

    @NotNull(message = "userId không được để trống")
    private Long userId;

    private Long parentId;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;

    private String attachmentUrl;
}
