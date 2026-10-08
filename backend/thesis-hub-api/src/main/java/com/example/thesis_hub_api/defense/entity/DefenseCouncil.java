package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity representing defense councils (HOIDONG).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 * Structure requirement: Exactly 5 members (1 President, 2 Secretaries, 2 Members).
 */
@Entity
@Table(name = "defense_councils")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseCouncil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the project round (loose reference to project_rounds table).
     */
    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    /**
     * Status of the council: DRAFT, ACTIVE, COMPLETED, CANCELLED.
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

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
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
