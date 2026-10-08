package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing reviewer lecturer assignment for a thesis (PHANCONGPHANBIEN).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 * Business Rule: GVPB ≠ GVHD
 */
@Entity
@Table(name = "reviewer_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewerAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the thesis to be reviewed (loose reference to theses table).
     * 1 thesis has 1 active reviewer assignment.
     */
    @Column(name = "thesis_id", nullable = false, unique = true)
    private Long thesisId;

    /**
     * ID of the reviewer lecturer (loose reference to lecturers table).
     */
    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    /**
     * ID of the user (e.g. Dean/Admin) assigning the reviewer.
     */
    @Column(name = "assigned_by")
    private Long assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    /**
     * Status of the assignment: ASSIGNED, IN_REVIEW, ACCEPTED, REJECTED, COMPLETED.
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ASSIGNED";

    @Column(name = "review_file_url", length = 500)
    private String reviewFileUrl;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.assignedAt == null) {
            this.assignedAt = now;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = "ASSIGNED";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
