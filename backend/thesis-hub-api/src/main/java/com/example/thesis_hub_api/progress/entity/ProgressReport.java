package com.example.thesis_hub_api.progress.entity;

import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.projectround.entity.TimelineMilestone;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity representing periodic progress reports submitted by students (BAOCAOTIENDO).
 * Module: Progress / Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "progress_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false)
    private Thesis thesis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id")
    private TimelineMilestone milestone;

    @Column(name = "report_title", nullable = false, length = 255)
    private String reportTitle;

    @Column(name = "completed_work", nullable = false, columnDefinition = "TEXT")
    private String completedWork;

    @Column(name = "planned_work", nullable = false, columnDefinition = "TEXT")
    private String plannedWork;

    @Column(columnDefinition = "TEXT")
    private String difficulties;

    @Column(name = "progress_percent", nullable = false)
    @Builder.Default
    private Integer progressPercent = 0;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /**
     * Report status: DRAFT, SUBMITTED, REVIEWED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SUBMITTED";

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private Instant submittedAt = Instant.now();

    @OneToOne(mappedBy = "progressReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private ProgressFeedback feedback;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
