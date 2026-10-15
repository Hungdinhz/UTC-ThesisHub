package com.example.thesis_hub_api.eligibility.service;

import com.example.thesis_hub_api.defense.repository.ReviewerAssignmentRepository;
import com.example.thesis_hub_api.defense.repository.ScoreRepository;
import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import com.example.thesis_hub_api.eligibility.repository.ReservationRequestRepository;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EligibilityServiceTest {

    @Mock
    private ReservationRequestRepository reservationRepository;

    @Spy
    private ExternalAcademicMockService academicMockService = new ExternalAcademicMockService();

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private ReviewerAssignmentRepository reviewerAssignmentRepository;

    @InjectMocks
    private EligibilityService eligibilityService;

    @Test
    void testCheckThesisEligibility_Eligible() {
        EligibilityCheckResponseDTO response = eligibilityService.checkThesisEligibility(101L, 10L);

        assertNotNull(response);
        assertEquals("ELIGIBLE", response.getStatus());
        assertTrue(response.getCompletedCredits() >= 110);
        assertTrue(response.getGpa() >= 2.0);
        assertFalse(response.isTuitionDebt());
    }

    @Test
    void testCheckThesisEligibility_Ineligible() {
        EligibilityCheckResponseDTO response = eligibilityService.checkThesisEligibility(102L, 10L);

        assertNotNull(response);
        assertEquals("INELIGIBLE", response.getStatus());
        assertFalse(response.getReasons().isEmpty());
    }

    @Test
    void testForceApprove() {
        ForceApproveRequestDTO request = ForceApproveRequestDTO.builder()
                .studentId(102L)
                .projectRoundId(10L)
                .approvedBy(999L)
                .reason("Chấp thuận trường hợp đặc biệt đã trả nợ môn")
                .build();

        EligibilityCheckResponseDTO response = eligibilityService.forceApprove(request);

        assertNotNull(response);
        assertEquals("FORCE_APPROVED", response.getStatus());
    }

    @Test
    void testDisqualify() {
        DisqualifyRequestDTO request = DisqualifyRequestDTO.builder()
                .studentId(101L)
                .projectRoundId(10L)
                .disqualifiedBy(999L)
                .reason("Gian lận học phần")
                .build();

        EligibilityCheckResponseDTO response = eligibilityService.disqualify(request);

        assertNotNull(response);
        assertEquals("DISQUALIFIED", response.getStatus());
    }

    @Test
    void testSubmitReservation_Success() {
        when(reservationRepository.findByStudentIdAndStatus(101L, "PENDING")).thenReturn(Optional.empty());
        when(reservationRepository.save(any(ReservationRequest.class))).thenAnswer(invocation -> {
            ReservationRequest req = invocation.getArgument(0);
            req.setId(1L);
            return req;
        });

        ReservationSubmitRequestDTO request = ReservationSubmitRequestDTO.builder()
                .studentId(101L)
                .thesisId(1L)
                .projectRoundId(10L)
                .reason("Bận lý do sức khỏe cần bảo lưu 1 kỳ")
                .build();

        ReservationResponseDTO response = eligibilityService.submitReservation(request);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals(101L, response.getStudentId());
    }

    @Test
    void testSubmitReservation_AlreadyPending_ThrowsException() {
        when(reservationRepository.findByStudentIdAndStatus(101L, "PENDING"))
                .thenReturn(Optional.of(new ReservationRequest()));

        ReservationSubmitRequestDTO request = ReservationSubmitRequestDTO.builder()
                .studentId(101L)
                .build();

        assertThrows(IllegalStateException.class, () -> eligibilityService.submitReservation(request));
    }

    @Test
    void testReviewReservation_Approve() {
        ReservationRequest entity = ReservationRequest.builder()
                .id(1L)
                .studentId(101L)
                .status("PENDING")
                .build();

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(reservationRepository.save(any(ReservationRequest.class))).thenAnswer(i -> i.getArgument(0));

        ReservationReviewRequestDTO request = ReservationReviewRequestDTO.builder()
                .status("APPROVED")
                .reviewedBy(999L)
                .note("Đã chấp nhận đơn")
                .build();

        ReservationResponseDTO response = eligibilityService.reviewReservation(1L, request);

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals(999L, response.getReviewedBy());
        assertNotNull(response.getReviewedAt());
    }

    @Test
    void testCheckFinalDefenseEligibility() {
        when(reviewerAssignmentRepository.existsByThesisId(1L)).thenReturn(true);

        FinalDefenseEligibilityResponseDTO response = eligibilityService.checkFinalDefenseEligibility(1L, 101L);

        assertNotNull(response);
        assertTrue(response.isEligibleForDefense());
        assertTrue(response.isSupervisorApproved());
        assertTrue(response.isReviewerAssigned());
    }
}
