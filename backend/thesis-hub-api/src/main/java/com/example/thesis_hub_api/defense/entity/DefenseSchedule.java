package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Entity representing defense schedules (LICHBAOVE).
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Entity
@Table(
    name = "defense_schedules",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_defense_schedules_council_date_session", columnNames = {"council_id", "defense_date", "session"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "council_id", nullable = false)
    private Long councilId;

    @Column(name = "defense_date", nullable = false)
    private LocalDate defenseDate;

    /**
     * Session: MORNING (Sáng), AFTERNOON (Chiều).
     */
    @Column(name = "session", nullable = false, length = 20)
    private String session;

    @Column(name = "room", length = 50)
    private String room;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    /**
     * Maximum number of students per session (default 12) for automated CSP scheduling.
     */
    @Column(name = "max_students", nullable = false)
    @Builder.Default
    private Integer maxStudents = 12;

    /**
     * Status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED.
     */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SCHEDULED";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
        if (this.maxStudents == null) {
            this.maxStudents = 12;
        }
        if (this.status == null) {
            this.status = "SCHEDULED";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
