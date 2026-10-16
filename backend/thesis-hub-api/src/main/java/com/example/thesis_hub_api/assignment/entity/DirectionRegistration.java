package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "direction_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectionRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "direction_id", nullable = false)
    private Long directionId;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "REGISTERED"; // REGISTERED, APPROVED, REJECTED, CANCELLED

    @Column(name = "registered_at", nullable = false)
    private Instant registeredAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.registeredAt == null) {
            this.registeredAt = Instant.now();
        }
        if (this.status == null) {
            this.status = "REGISTERED";
        }
    }
}
