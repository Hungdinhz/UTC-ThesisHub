package com.example.thesis_hub_api.eligibility.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing student reservation requests (DONBAOLUU).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Entity
@Table(name = "reservation_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the student submitting the reservation request (loose reference to students table).
     */
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    /**
     * ID of the thesis being reserved, if already formed (loose reference to theses table).
     */
    @Column(name = "thesis_id")
    private Long thesisId;

    /**
     * ID of the project round (loose reference to project_rounds table).
     */
    @Column(name = "project_round_id")
    private Long projectRoundId;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    /**
     * Category of reservation reason:
     * INSUFFICIENT_CREDITS (Đạt GVHD nhưng thiếu tín chỉ/nợ môn),
     * SUPERVISOR_NOT_ELIGIBLE (GVHD xét không đủ điều kiện/tiến độ),
     * RESEARCH_PROGRESS, HEALTH_REASONS, INTERNSHIP_WORK, FAMILY_CIRCUMSTANCES, OTHER.
     */
    @Column(name = "reason_category", length = 50)
    @Builder.Default
    private String reasonCategory = "OTHER";

    @Column(name = "evidence_file_url", columnDefinition = "TEXT")
    private String evidenceFileUrl;

    @Column(name = "evidence_file_name", length = 255)
    private String evidenceFileName;

    @Column(name = "supervisor_approved")
    private Boolean supervisorApproved;

    @Column(name = "supervisor_comment", columnDefinition = "TEXT")
    private String supervisorComment;

    @Column(name = "target_round_code", length = 50)
    private String targetRoundCode;

    /**
     * Status of the request: PENDING, APPROVED, REJECTED, CANCELLED.
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    /**
     * ID of the user (e.g. Dean/Admin) reviewing the request.
     */
    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.submittedAt == null) {
            this.submittedAt = now;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.reasonCategory == null) {
            this.reasonCategory = "OTHER";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
