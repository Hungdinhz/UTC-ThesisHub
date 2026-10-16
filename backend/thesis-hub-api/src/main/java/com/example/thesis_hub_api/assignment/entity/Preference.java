package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    /**
     * Priority order: 1 (NV1), 2 (NV2), 3 (NV3)
     */
    @Column(name = "priority", nullable = false)
    private Integer priority;

    /**
     * Student's GPA for tie-breaking and prioritization criteria
     */
    @Column(name = "gpa")
    private Double gpa;

    /**
     * JSON string or text describing secondary criteria (e.g. skills, certifications, desired topic)
     */
    @Column(name = "prioritization_criteria", columnDefinition = "TEXT")
    private String prioritizationCriteria;

    /**
     * Status: PENDING, ACCEPTED, REJECTED
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
