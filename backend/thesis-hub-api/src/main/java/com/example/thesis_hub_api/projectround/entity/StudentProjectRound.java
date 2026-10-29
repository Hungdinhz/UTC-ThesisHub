package com.example.thesis_hub_api.projectround.entity;

import com.example.thesis_hub_api.organization.entity.Student;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "student_project_rounds", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "project_round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProjectRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_round_id", nullable = false)
    private ProjectRound projectRound;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "ELIGIBLE"; // ELIGIBLE, REGISTERED, ASSIGNED, IN_PROGRESS, DROPPED, DEFENDED, RESERVED

    @Column(name = "gpa")
    private Double gpa;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
