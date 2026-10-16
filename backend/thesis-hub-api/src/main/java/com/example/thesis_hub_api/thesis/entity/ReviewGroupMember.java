package com.example.thesis_hub_api.thesis.entity;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity representing a member of a Proposal Review Group (THANHVIENNHOMXETDUYET).
 * Module: Thesis / Project Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "review_group_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"review_group_id", "lecturer_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_group_id", nullable = false)
    private ReviewGroup reviewGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private Lecturer lecturer;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String role = "MEMBER"; // LEADER, SECRETARY, MEMBER

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
