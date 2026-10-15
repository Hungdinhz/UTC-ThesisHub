package com.example.thesis_hub_api.progress.entity;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity representing lecturer's evaluation and feedback for a progress report (NHANXETTIENDO).
 * Module: Progress / Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "progress_feedbacks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"progress_report_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_report_id", nullable = false)
    private ProgressReport progressReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private Lecturer lecturer;

    @Column(name = "feedback_content", nullable = false, columnDefinition = "TEXT")
    private String feedbackContent;

    /**
     * Assessment rating: DAT, KHONG_DAT, XUAT_SAC, CAN_CO_GANG
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String assessment = "DAT";

    @Column(name = "confirmed_completion_rate", precision = 5, scale = 2)
    private BigDecimal confirmedCompletionRate;

    @Column(name = "feedback_at", nullable = false)
    @Builder.Default
    private Instant feedbackAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
