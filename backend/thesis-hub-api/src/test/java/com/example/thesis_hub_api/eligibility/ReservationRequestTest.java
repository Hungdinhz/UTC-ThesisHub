package com.example.thesis_hub_api.eligibility;

import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ReservationRequest Entity Tests - Module 4")
class ReservationRequestTest {

    @Test
    @DisplayName("Should create ReservationRequest with Builder and initialize defaults via prePersist")
    void testReservationRequestCreationAndLifecycle() {
        ReservationRequest request = ReservationRequest.builder()
                .studentId(101L)
                .thesisId(202L)
                .projectRoundId(1L)
                .reason("Health issues requiring semester deferment")
                .build();

        assertNull(request.getSubmittedAt());
        assertNull(request.getCreatedAt());

        request.prePersist();

        assertEquals(101L, request.getStudentId());
        assertEquals(202L, request.getThesisId());
        assertEquals(1L, request.getProjectRoundId());
        assertEquals("PENDING", request.getStatus());
        assertNotNull(request.getSubmittedAt());
        assertNotNull(request.getCreatedAt());
        assertNotNull(request.getUpdatedAt());

        Instant originalUpdatedAt = request.getUpdatedAt();
        request.setStatus("APPROVED");
        request.setReviewedBy(50L);
        request.setReviewedAt(Instant.now());
        request.preUpdate();

        assertEquals("APPROVED", request.getStatus());
        assertEquals(50L, request.getReviewedBy());
        assertNotNull(request.getReviewedAt());
        assertTrue(request.getUpdatedAt().isAfter(originalUpdatedAt) || request.getUpdatedAt().equals(originalUpdatedAt));
    }
}
