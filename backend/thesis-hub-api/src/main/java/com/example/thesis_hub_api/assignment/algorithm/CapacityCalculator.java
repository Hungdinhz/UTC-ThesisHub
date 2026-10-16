package com.example.thesis_hub_api.assignment.algorithm;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Encapsulates the capacity calculation logic:
 * - Effective capacity calculation based on base quota and capacity coefficient.
 * - Remaining capacity calculation.
 * - Availability checks.
 * - Capacity updates during assignment allocation, cancellation, and manual override.
 */
@Component
public class CapacityCalculator {

    /**
     * Calculates effective capacity: baseQuota * capacityCoefficient (rounded to nearest integer).
     */
    public int calculateEffectiveCapacity(Integer baseQuota, BigDecimal capacityCoefficient) {
        if (baseQuota == null || baseQuota <= 0) {
            return 0;
        }
        if (capacityCoefficient == null || capacityCoefficient.compareTo(BigDecimal.ZERO) <= 0) {
            return baseQuota;
        }
        return BigDecimal.valueOf(baseQuota)
                .multiply(capacityCoefficient)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    /**
     * Calculates remaining capacity = effectiveCapacity - assignedCount.
     */
    public int calculateRemainingCapacity(Integer effectiveCapacity, Integer assignedCount) {
        int effective = effectiveCapacity != null ? effectiveCapacity : 0;
        int assigned = assignedCount != null ? assignedCount : 0;
        return Math.max(0, effective - assigned);
    }

    /**
     * Checks if the lecturer capacity has available slots.
     */
    public boolean isAvailable(LecturerCapacity capacity) {
        if (capacity == null) {
            return false;
        }
        return capacity.getRemainingCapacity() > 0;
    }

    /**
     * Increments assigned count by 1.
     */
    public void incrementAssignedCount(LecturerCapacity capacity) {
        if (capacity == null) return;
        int current = capacity.getAssignedCount() != null ? capacity.getAssignedCount() : 0;
        capacity.setAssignedCount(current + 1);
    }

    /**
     * Decrements assigned count by 1 (minimum 0).
     */
    public void decrementAssignedCount(LecturerCapacity capacity) {
        if (capacity == null) return;
        int current = capacity.getAssignedCount() != null ? capacity.getAssignedCount() : 0;
        capacity.setAssignedCount(Math.max(0, current - 1));
    }

    /**
     * Handles capacity adjustments during manual override:
     * Decrements the old lecturer's assigned count and increments the new lecturer's assigned count.
     */
    public void adjustForOverride(LecturerCapacity oldCapacity, LecturerCapacity newCapacity) {
        if (oldCapacity != null) {
            decrementAssignedCount(oldCapacity);
        }
        if (newCapacity != null) {
            incrementAssignedCount(newCapacity);
        }
    }
}
