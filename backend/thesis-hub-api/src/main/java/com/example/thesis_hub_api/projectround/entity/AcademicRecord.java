package com.example.thesis_hub_api.projectround.entity;

import com.example.thesis_hub_api.organization.entity.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "academic_records", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "project_round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_round_id")
    private ProjectRound projectRound;

    @Column(name = "completed_credits", nullable = false)
    @Builder.Default
    private Integer completedCredits = 0;

    @Column(nullable = false)
    @Builder.Default
    private Double gpa = 0.0;

    @Column(name = "tuition_debt", nullable = false)
    @Builder.Default
    private Boolean tuitionDebt = false;

    @Column(name = "under_disciplinary_action", nullable = false)
    @Builder.Default
    private Boolean underDisciplinaryAction = false;

    @Column(name = "missing_prerequisite_count", nullable = false)
    @Builder.Default
    private Integer missingPrerequisiteCount = 0;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "imported_at", nullable = false)
    @Builder.Default
    private Instant importedAt = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
