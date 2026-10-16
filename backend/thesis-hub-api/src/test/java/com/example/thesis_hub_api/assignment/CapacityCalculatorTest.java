package com.example.thesis_hub_api.assignment;

import com.example.thesis_hub_api.assignment.algorithm.CapacityCalculator;
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Capacity Calculator Unit Tests")
class CapacityCalculatorTest {

    private CapacityCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new CapacityCalculator();
    }

    @Test
    @DisplayName("Calculate effective capacity with standard factor 1.0")
    void testEffectiveCapacity_Standard() {
        int capacity = calculator.calculateEffectiveCapacity(5, BigDecimal.valueOf(1.0));
        assertEquals(5, capacity);
    }

    @Test
    @DisplayName("Calculate effective capacity with increased factor 1.2")
    void testEffectiveCapacity_HigherFactor() {
        // 5 * 1.2 = 6.0 -> 6
        int capacity = calculator.calculateEffectiveCapacity(5, BigDecimal.valueOf(1.2));
        assertEquals(6, capacity);
    }

    @Test
    @DisplayName("Calculate effective capacity with reduced factor 0.8")
    void testEffectiveCapacity_ReducedFactor() {
        // 5 * 0.8 = 4.0 -> 4
        int capacity = calculator.calculateEffectiveCapacity(5, BigDecimal.valueOf(0.8));
        assertEquals(4, capacity);
    }

    @Test
    @DisplayName("Calculate remaining capacity")
    void testRemainingCapacity() {
        assertEquals(3, calculator.calculateRemainingCapacity(5, 2));
        assertEquals(0, calculator.calculateRemainingCapacity(5, 5));
        assertEquals(0, calculator.calculateRemainingCapacity(5, 6)); // Cannot be negative
    }

    @Test
    @DisplayName("Check availability on LecturerCapacity entity")
    void testIsAvailable() {
        LecturerCapacity cap = LecturerCapacity.builder()
                .maxQuota(5)
                .capacityFactor(1.0)
                .currentAssigned(4)
                .build();
        assertTrue(calculator.isAvailable(cap));

        cap.setCurrentAssigned(5);
        assertFalse(calculator.isAvailable(cap));
    }

    @Test
    @DisplayName("Adjust capacities during manual override")
    void testAdjustForOverride() {
        LecturerCapacity oldCap = LecturerCapacity.builder()
                .maxQuota(5)
                .capacityFactor(1.0)
                .currentAssigned(3)
                .build();

        LecturerCapacity newCap = LecturerCapacity.builder()
                .maxQuota(5)
                .capacityFactor(1.0)
                .currentAssigned(1)
                .build();

        calculator.adjustForOverride(oldCap, newCap);

        assertEquals(2, oldCap.getAssignedCount());
        assertEquals(2, newCap.getAssignedCount());
    }
}
