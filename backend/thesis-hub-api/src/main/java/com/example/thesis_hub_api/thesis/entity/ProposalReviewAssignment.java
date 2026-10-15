package com.example.thesis_hub_api.thesis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity assigning a proposal to a review group.
 * Table: proposal_review_assignments
 * Module: Thesis & Progress (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "proposal_review_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalReviewAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "proposal_id", nullable = false)
    private Long proposalId;

    @Column(name = "assigned_by")
    private Long assignedBy;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "result", length = 30)
    private String result;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

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
        if (this.assignedAt == null) {
            this.assignedAt = now;
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
