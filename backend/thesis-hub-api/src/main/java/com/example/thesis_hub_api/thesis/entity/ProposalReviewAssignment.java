package com.example.thesis_hub_api.thesis.entity;

import com.example.thesis_hub_api.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity representing proposal assignment to a review group (PHANCONGXETDUYET).
 * Module: Thesis / Project Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "proposal_review_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"proposal_id", "review_group_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalReviewAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_group_id", nullable = false)
    private ReviewGroup reviewGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();

    /**
     * Review status: PENDING, IN_REVIEW, APPROVED, REVISE_REQUIRED, REJECTED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "evaluation_notes", columnDefinition = "TEXT")
    private String evaluationNotes;

    @Column(name = "decision_date")
    private Instant decisionDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
