package com.example.thesis_hub_api.projectround.entity;

import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_rounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "round_code", nullable = false, unique = true, length = 100)
    private String roundCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "academic_year", nullable = false, length = 50)
    private String academicYear;

    @Column(nullable = false, length = 20)
    private String semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_program_id")
    private TrainingProgram trainingProgram;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, OPEN, IN_PROGRESS, CLOSED, ARCHIVED

    @Column(name = "supplementary_open", nullable = false)
    @Builder.Default
    private Boolean supplementaryOpen = false;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "projectRound", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, startDate ASC")
    @Builder.Default
    private List<TimelineMilestone> milestones = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
