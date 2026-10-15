package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity representing final graduation project results (KETQUATOTNGHIEP).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Entity
@Table(name = "graduation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraduationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the thesis (loose reference to theses table, 1-to-1 relationship).
     */
    @Column(name = "thesis_id", nullable = false, unique = true)
    private Long thesisId;

    @Column(name = "supervisor_score", precision = 4, scale = 2)
    private BigDecimal supervisorScore;

    @Column(name = "reviewer_score", precision = 4, scale = 2)
    private BigDecimal reviewerScore;

    @Column(name = "council_score", precision = 4, scale = 2)
    private BigDecimal councilScore;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    /**
     * Academic grade rating: EXCELLENT, VERY_GOOD, GOOD, AVERAGE, POOR.
     */
    @Column(name = "grade", length = 30)
    private String grade;

    /**
     * Final evaluation: PASSED (Đạt), FAILED (Không đạt).
     */
    @Column(name = "final_result", length = 20)
    private String finalResult;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
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
