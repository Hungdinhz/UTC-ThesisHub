package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "lecturer_capacities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LecturerCapacity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    @Column(name = "project_round_id", nullable = false)
    private Long projectRoundId;

    @Column(name = "max_quota", nullable = false)
    @Builder.Default
    private Integer maxQuota = 5;

    @Column(name = "capacity_factor", nullable = false)
    @Builder.Default
    private Double capacityFactor = 1.0;

    @Column(name = "current_assigned", nullable = false)
    @Builder.Default
    private Integer currentAssigned = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Integer getAssignedCount() {
        return currentAssigned != null ? currentAssigned : 0;
    }

    public void setAssignedCount(Integer assignedCount) {
        this.currentAssigned = assignedCount != null ? assignedCount : 0;
    }

    public BigDecimal getCapacityCoefficient() {
        return capacityFactor != null ? BigDecimal.valueOf(capacityFactor) : BigDecimal.ONE;
    }

    public void setCapacityCoefficient(BigDecimal coefficient) {
        this.capacityFactor = coefficient != null ? coefficient.doubleValue() : 1.0;
    }

    /**
     * Calculates the effective capacity rounding to nearest integer.
     */
    public int getEffectiveCapacity() {
        if (capacityFactor == null || capacityFactor <= 0) {
            return maxQuota != null ? maxQuota : 0;
        }
        return (int) Math.round(maxQuota * capacityFactor);
    }

    /**
     * Calculates remaining slots available.
     */
    public int getRemainingCapacity() {
        return Math.max(0, getEffectiveCapacity() - getAssignedCount());
    }
}
