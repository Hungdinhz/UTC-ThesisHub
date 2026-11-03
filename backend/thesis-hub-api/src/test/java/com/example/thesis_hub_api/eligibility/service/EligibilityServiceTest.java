package com.example.thesis_hub_api.eligibility.service;

import com.example.thesis_hub_api.defense.repository.ReviewerAssignmentRepository;
import com.example.thesis_hub_api.defense.repository.ScoreRepository;
import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import com.example.thesis_hub_api.eligibility.repository.ReservationRequestRepository;
import com.example.thesis_hub_api.eligibility.service.mock.ExternalAcademicMockService;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
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

    @Mock
    private ThesisRepository thesisRepository;

    @Mock
    private StudentProjectRoundRepository studentProjectRoundRepository;

    @InjectMocks
    private EligibilityService eligibilityService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(eligibilityService, "thesisRepository", thesisRepository);
        ReflectionTestUtils.setField(eligibilityService, "studentProjectRoundRepository", studentProjectRoundRepository);
    }

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
                .approvedBy("999")
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
                .disqualifiedBy("999")
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
                .reasonCategory("HEALTH_REASONS")
                .reason("Bận lý do sức khỏe cần bảo lưu 1 kỳ")
                .build();

        ReservationResponseDTO response = eligibilityService.submitReservation(request);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals(101L, response.getStudentId());
        assertEquals("HEALTH_REASONS", response.getReasonCategory());
    }

    @Test
    void testSubmitReservation_InsufficientCredits_Success() {
        when(reservationRepository.findByStudentIdAndStatus(102L, "PENDING")).thenReturn(Optional.empty());
        when(reservationRepository.save(any(ReservationRequest.class))).thenAnswer(i -> {
            ReservationRequest req = i.getArgument(0);
            req.setId(2L);
            return req;
        });

        ReservationSubmitRequestDTO request = ReservationSubmitRequestDTO.builder()
                .studentId(102L)
                .projectRoundId(10L)
                .reasonCategory("INSUFFICIENT_CREDITS")
                .reason("Chưa trả đủ tín chỉ tốt nghiệp, xin bảo lưu kết quả đồ án")
                .build();

        ReservationResponseDTO response = eligibilityService.submitReservation(request);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals("INSUFFICIENT_CREDITS", response.getReasonCategory());
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
    void testReviewReservation_Approve_UpdatesThesisAndStudentStatusToReserved() {
        ReservationRequest entity = ReservationRequest.builder()
                .id(1L)
                .studentId(101L)
                .thesisId(5L)
                .projectRoundId(10L)
                .reasonCategory("INSUFFICIENT_CREDITS")
                .status("PENDING")
                .build();

        Thesis thesis = Thesis.builder()
                .id(5L)
                .status("IN_PROGRESS")
                .defenseEligible(true)
                .build();

        StudentProjectRound spr = StudentProjectRound.builder()
                .id(1L)
                .status("IN_PROGRESS")
                .build();

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(reservationRepository.save(any(ReservationRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(thesisRepository.findById(5L)).thenReturn(Optional.of(thesis));
        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(101L, 10L)).thenReturn(Optional.of(spr));

        ReservationReviewRequestDTO request = ReservationReviewRequestDTO.builder()
                .status("APPROVED")
                .reviewedBy(999L)
                .note("Đã chấp thuận bảo lưu đồ án")
                .build();

        ReservationResponseDTO response = eligibilityService.reviewReservation(1L, request);

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals(999L, response.getReviewedBy());
        assertNotNull(response.getReviewedAt());

        // Verify status updates
        assertEquals("RESERVED", thesis.getStatus());
        assertFalse(thesis.getDefenseEligible());
        assertEquals("RESERVED", spr.getStatus());
        verify(thesisRepository).save(thesis);
        verify(studentProjectRoundRepository).save(spr);
    }

    @Test
    void testCreateReservationByAdmin_AutoApprove() {
        Thesis thesis = Thesis.builder().id(10L).status("IN_PROGRESS").build();
        StudentProjectRound spr = StudentProjectRound.builder().id(20L).status("IN_PROGRESS").build();

        when(thesisRepository.findById(10L)).thenReturn(Optional.of(thesis));
        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(105L, 10L)).thenReturn(Optional.of(spr));
        when(reservationRepository.save(any(ReservationRequest.class))).thenAnswer(i -> {
            ReservationRequest req = i.getArgument(0);
            req.setId(99L);
            return req;
        });

        AdminCreateReservationRequestDTO request = AdminCreateReservationRequestDTO.builder()
                .studentId(105L)
                .thesisId(10L)
                .projectRoundId(10L)
                .reasonCategory("INSUFFICIENT_CREDITS")
                .reason("Khoa bảo lưu theo đơn giấy do chưa trả nợ môn")
                .autoApprove(true)
                .reviewedBy(888L)
                .build();

        ReservationResponseDTO response = eligibilityService.createReservationByAdmin(request);

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals("RESERVED", thesis.getStatus());
        assertEquals("RESERVED", spr.getStatus());
    }

    @Test
    void testCheckFinalDefenseEligibility_ApprovedReservation_NotEligibleForDefense() {
        ReservationRequest reservation = ReservationRequest.builder()
                .id(15L)
                .studentId(101L)
                .status("APPROVED")
                .reasonCategory("INSUFFICIENT_CREDITS")
                .reason("Bảo lưu kết quả chờ trả nợ tín chỉ")
                .build();

        when(reservationRepository.findFirstByStudentIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(reservation));

        FinalDefenseEligibilityResponseDTO response = eligibilityService.checkFinalDefenseEligibility(1L, 101L);

        assertNotNull(response);
        assertFalse(response.isEligibleForDefense());
        assertEquals("APPROVED", response.getReservationStatus());
        assertTrue(response.getReasons().stream().anyMatch(r -> r.contains("BẢO LƯU")));
    }

    @Test
    void testCheckFinalDefenseEligibility_SupervisorApprovedButLacksCredits() {
        // Student 102 has < 110 credits in mock service
        when(reviewerAssignmentRepository.existsByThesisId(2L)).thenReturn(false);

        FinalDefenseEligibilityResponseDTO response = eligibilityService.checkFinalDefenseEligibility(2L, 102L);

        assertNotNull(response);
        assertFalse(response.isEligibleForDefense());
        assertTrue(response.getReasons().stream().anyMatch(r -> r.contains("CHƯA TRẢ ĐỦ TÍN CHỈ") || r.contains("tín chỉ")));
    }

    @Test
    void testCheckFinalDefenseEligibility_DroppedStudent_NotEligible() {
        StudentProjectRound spr = StudentProjectRound.builder()
                .id(99L)
                .status("DROPPED")
                .note("Tự động loại do không nộp nguyện vọng")
                .build();

        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(101L, 10L)).thenReturn(Optional.of(spr));

        FinalDefenseEligibilityResponseDTO response = eligibilityService.checkFinalDefenseEligibility(null, 101L, "SV101", 10L);

        assertNotNull(response);
        assertFalse(response.isEligibleForDefense());
        assertEquals("DROPPED", response.getStudentRoundStatus());
        assertFalse(response.isSupervisorApproved());
        assertEquals(0.0, response.getThesisProgressPercentage());
        assertTrue(response.getReasons().stream().anyMatch(r -> r.contains("BỊ LOẠI KHỎI ĐỢT")));
    }

    @Test
    void testCheckFinalDefenseEligibility_DisqualifiedStudent_NotEligible() {
        StudentProjectRound spr = StudentProjectRound.builder()
                .id(100L)
                .status("DISQUALIFIED")
                .note("Vi phạm kỷ luật học phần")
                .build();

        when(studentProjectRoundRepository.findByStudentIdAndProjectRoundId(101L, 10L)).thenReturn(Optional.of(spr));

        FinalDefenseEligibilityResponseDTO response = eligibilityService.checkFinalDefenseEligibility(null, 101L, "SV101", 10L);

        assertNotNull(response);
        assertFalse(response.isEligibleForDefense());
        assertEquals("DISQUALIFIED", response.getStudentRoundStatus());
        assertTrue(response.getReasons().stream().anyMatch(r -> r.contains("BỊ ĐÌNH CHỈ / BỊ LOẠI")));
    }
}
