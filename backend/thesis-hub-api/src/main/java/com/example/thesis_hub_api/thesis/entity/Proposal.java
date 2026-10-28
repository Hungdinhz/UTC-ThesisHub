package com.example.thesis_hub_api.thesis.entity;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity representing a Graduation Thesis Proposal (DECUONG).
 * Module: Thesis / Project Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "proposals", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "project_round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_round_id", nullable = false)
    private ProjectRound projectRound;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private Lecturer lecturer;

    @Column(name = "title_vn", nullable = false, length = 500)
    private String titleVn;

    @Column(name = "title_en", length = 500)
    private String titleEn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(name = "expected_results", columnDefinition = "TEXT")
    private String expectedResults;

    @Column(name = "research_content", columnDefinition = "TEXT")
    private String researchContent;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /**
     * Proposal lifecycle status:
     * DRAFT, SUBMITTED, ASSIGNED, UNDER_REVIEW, APPROVED, REVISE_REQUIRED, REJECTED
     */
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT";

    @Column(name = "supervisor_approved", nullable = false)
    @Builder.Default
    private Boolean supervisorApproved = false;

    @Column(name = "supervisor_comment", columnDefinition = "TEXT")
    private String supervisorComment;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "student_signed", nullable = false)
    @Builder.Default
    private Boolean studentSigned = false;

    @Column(name = "student_signed_at")
    private Instant studentSignedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
