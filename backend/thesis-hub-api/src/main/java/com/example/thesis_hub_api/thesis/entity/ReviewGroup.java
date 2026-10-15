package com.example.thesis_hub_api.thesis.entity;

import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a Proposal Review Group / Sub-committee (NHOMXETDUYET).
 * Module: Thesis / Project Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "review_groups", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_round_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_round_id", nullable = false)
    private ProjectRound projectRound;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, DISSOLVED

    @OneToMany(mappedBy = "reviewGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReviewGroupMember> members = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
