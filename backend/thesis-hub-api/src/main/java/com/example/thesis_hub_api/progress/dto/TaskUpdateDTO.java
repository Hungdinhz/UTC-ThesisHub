package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateDTO {
    private String title;
    private String description;
    private Instant dueDate;
    private String status;
}
