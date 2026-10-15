package com.example.thesis_hub_api.thesis.entity;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity representing an official Graduation Thesis (DETAI).
 * Module: Thesis / Project Execution (Owner: Ngo Minh Quyet)
 * This is the central entity referenced by Defense, ReviewerAssignment, and Grading modules.
 */
@Entity
@Table(name = "theses", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "project_round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Thesis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_round_id", nullable = false)
    private ProjectRound projectRound;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private Lecturer lecturer;

    @Column(name = "thesis_code", unique = true, length = 100)
    private String thesisCode;

    @Column(name = "title_vn", nullable = false, length = 500)
    private String titleVn;

    @Column(name = "title_en", length = 500)
    private String titleEn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(length = 500)
    private String technologies;

    /**
     * Status lifecycle:
     * DRAFT, APPROVED, IN_PROGRESS, UNDER_REVIEW, DEFENSE_READY, COMPLETED, CANCELLED
     */
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "IN_PROGRESS";

    @Column(name = "completion_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal completionRate = BigDecimal.ZERO;

    @Column(name = "defense_eligible", nullable = false)
    @Builder.Default
    private Boolean defenseEligible = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
