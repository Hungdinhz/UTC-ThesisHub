package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity representing scores and evaluation notes (DIEMSO).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Entity
@Table(
    name = "scores",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_scores_thesis_grader_type", columnNames = {"thesis_id", "grader_id", "score_type"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the thesis being evaluated (loose reference to theses table).
     */
    @Column(name = "thesis_id", nullable = false)
    private Long thesisId;

    /**
     * ID of the user grading the thesis (loose reference to users table).
     */
    @Column(name = "grader_id", nullable = false)
    private Long graderId;

    /**
     * Score type: SUPERVISOR (GVHD), REVIEWER (GVPB), COUNCIL (Hoi dong).
     */
    @Column(name = "score_type", nullable = false, length = 30)
    private String scoreType;

    /**
     * Score value from 0.00 to 10.00.
     */
    @Column(name = "score", nullable = false, precision = 4, scale = 2)
    private BigDecimal score;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "graded_at", nullable = false)
    private Instant gradedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.gradedAt == null) {
            this.gradedAt = now;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
