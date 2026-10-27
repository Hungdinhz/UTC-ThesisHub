package com.example.thesis_hub_api.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkReadRequestDTO {

    @JsonProperty("notification_ids")
    private List<Long> notificationIds;
}
