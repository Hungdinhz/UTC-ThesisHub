package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "assignment_id")
    private Integer assignmentId;

    @Column(name = "project_round_id", nullable = false)
    private Integer projectRoundId;

    @Column(nullable = false, length = 50)
    private String action; // GENERATE, OVERRIDE, FINALIZE

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(length = 255)
    private String reason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
