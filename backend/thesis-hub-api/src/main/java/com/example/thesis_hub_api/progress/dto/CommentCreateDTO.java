package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateDTO {
    private Long taskId;
    private Long submissionId;
    private Long authorId;
    private String content;
}
