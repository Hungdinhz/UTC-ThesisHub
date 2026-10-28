package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MinutesSignatureItemDTO {
    private Long memberId;
    private Long councilId;
    private Long lecturerId;
    private String lecturerName;
    private String role;
    private String slotLabel;
    private Boolean signed;
    private Instant signedAt;
}
