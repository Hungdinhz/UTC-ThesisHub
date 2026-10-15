package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "lecturer_capacities", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"lecturer_id", "project_round_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LecturerCapacity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "lecturer_id", nullable = false)
    private Integer lecturerId;

    @Column(name = "project_round_id", nullable = false)
    private Integer projectRoundId;

    @Column(name = "base_quota", nullable = false)
    private Integer baseQuota;

    @Column(name = "capacity_coefficient", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal capacityCoefficient = BigDecimal.ONE;

    @Column(name = "effective_capacity", nullable = false)
    private Integer effectiveCapacity;

    @Column(name = "assigned_count", nullable = false)
    @Builder.Default
    private Integer assignedCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateEffectiveCapacity();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateEffectiveCapacity();
    }

    public void calculateEffectiveCapacity() {
        if (baseQuota != null && capacityCoefficient != null) {
            this.effectiveCapacity = BigDecimal.valueOf(baseQuota)
                    .multiply(capacityCoefficient)
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValue();
        } else {
            this.effectiveCapacity = 0;
        }
    }

    @Transient
    public Integer getRemainingCapacity() {
        return (effectiveCapacity != null ? effectiveCapacity : 0) - (assignedCount != null ? assignedCount : 0);
    }
}
