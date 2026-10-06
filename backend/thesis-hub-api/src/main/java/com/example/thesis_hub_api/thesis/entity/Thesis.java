package com.example.thesis_hub_api.thesis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing theses/projects.
 * Table: theses
 * Module: Thesis & Progress (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "theses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Thesis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "english_title", length = 500)
    private String englishTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT";

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
        if (this.status == null) {
            this.status = "DRAFT";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
