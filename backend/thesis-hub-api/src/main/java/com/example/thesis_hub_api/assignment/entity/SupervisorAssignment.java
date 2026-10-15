package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "supervisor_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "project_round_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "lecturer_id", nullable = false)
    private Integer lecturerId;

    @Column(name = "project_round_id", nullable = false)
    private Integer projectRoundId;

    @Column(name = "project_direction_id", nullable = false)
    private Integer projectDirectionId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PROPOSED"; // PROPOSED, FINAL

    @Column(name = "preference_order")
    private Integer preferenceOrder; // 1, 2, 3

    private Integer score;

    @Column(length = 255)
    private String reason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
