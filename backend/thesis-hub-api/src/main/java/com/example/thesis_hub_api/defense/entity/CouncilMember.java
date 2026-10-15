package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing defense council members (THANHVIENHOIDONG).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 * Business Rule (AGENTS.md):
 * - Role: PRESIDENT (Chủ tịch), SECRETARY (Thư ký), MEMBER (Ủy viên).
 * - Hard constraint: GVHD(s) NOT IN CouncilMembers(s) of that thesis.
 */
@Entity
@Table(
    name = "council_members",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_council_members_council_lecturer", columnNames = {"council_id", "lecturer_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "council_id", nullable = false)
    private Long councilId;

    /**
     * ID of the member lecturer (loose reference to lecturers table).
     */
    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    /**
     * Role in council: PRESIDENT, SECRETARY, MEMBER.
     */
    @Column(name = "role", nullable = false, length = 30)
    private String role;

    @Column(name = "confirmed", nullable = false)
    @Builder.Default
    private Boolean confirmed = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.confirmed == null) {
            this.confirmed = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
