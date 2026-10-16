package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "supervisor_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "direction_id")
    private Long directionId;

    /**
     * 1 = NV1, 2 = NV2, 3 = NV3, 0 = Non-preference/fallback
     */
    @Column(name = "matched_priority")
    private Integer matchedPriority;

    @Column(name = "match_score")
    private Double matchScore;

    @Column(name = "assignment_method", nullable = false, length = 50)
    @Builder.Default
    private String assignmentMethod = "ALGORITHM"; // ALGORITHM, MANUAL_OVERRIDE, DIRECT_ASSIGNMENT

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PROPOSED"; // PROPOSED, OVERRIDDEN, FINALIZED, CANCELLED

    @Column(name = "is_overridden", nullable = false)
    @Builder.Default
    private Boolean isOverridden = false;

    @Column(name = "previous_lecturer_id")
    private Long previousLecturerId;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Column(name = "overridden_by")
    private Long overriddenBy;

    @Column(name = "overridden_at")
    private Instant overriddenAt;

    @Column(name = "finalized_by")
    private Long finalizedBy;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Helper compatibility methods
    public Long getProjectDirectionId() {
        return directionId;
    }

    public void setProjectDirectionId(Long directionId) {
        this.directionId = directionId;
    }

    public String getReason() {
        return overrideReason;
    }

    public void setReason(String reason) {
        this.overrideReason = reason;
    }
}
