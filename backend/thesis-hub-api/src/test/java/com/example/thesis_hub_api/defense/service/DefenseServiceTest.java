package com.example.thesis_hub_api.defense.service;

import com.example.thesis_hub_api.defense.algorithm.DefenseCouncilScheduler;
import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.entity.*;
import com.example.thesis_hub_api.defense.repository.*;
import com.example.thesis_hub_api.defense.service.mock.ExternalThesisMockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DefenseServiceTest {

    @Mock
    private DefenseCouncilRepository councilRepository;

    @Mock
    private CouncilMemberRepository memberRepository;

    @Mock
    private ReviewerAssignmentRepository reviewerAssignmentRepository;

    @Mock
    private DefenseScheduleRepository scheduleRepository;

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private GraduationResultRepository graduationResultRepository;

    @Spy
    private DefenseCouncilScheduler councilScheduler = new DefenseCouncilScheduler();

    @Spy
    private ExternalThesisMockService thesisMockService = new ExternalThesisMockService();

    @InjectMocks
    private DefenseService defenseService;

    @Test
    void testGenerateCouncils() {
        when(councilRepository.count()).thenReturn(0L);
        when(councilRepository.save(any(DefenseCouncil.class))).thenAnswer(i -> {
            DefenseCouncil dc = i.getArgument(0);
            dc.setId(10L);
            return dc;
        });
        when(memberRepository.save(any(CouncilMember.class))).thenAnswer(i -> {
            CouncilMember cm = i.getArgument(0);
            cm.setId(100L);
            return cm;
        });

        CouncilGenerationRequestDTO req = new CouncilGenerationRequestDTO();
        req.setProjectRoundId(10L);
        req.setMaxStudentsPerCouncil(5);

        List<CouncilResponseDTO> result = defenseService.generateCouncils(req);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        CouncilResponseDTO council = result.get(0);
        assertEquals(5, council.getMembers().size());
        assertEquals("ACTIVE", council.getStatus());
    }

    @Test
    void testAssignReviewer_Success() {
        when(reviewerAssignmentRepository.findByThesisId(1L)).thenReturn(Optional.empty());
        when(reviewerAssignmentRepository.save(any(ReviewerAssignment.class))).thenAnswer(i -> {
            ReviewerAssignment ra = i.getArgument(0);
            ra.setId(1L);
            return ra;
        });

        // Thesis 1 has advisor 501. Reviewer is 502 (different) -> should succeed
        ReviewerAssignRequestDTO request = ReviewerAssignRequestDTO.builder()
                .thesisId(1L)
                .reviewerId(502L)
                .assignedBy(999L)
                .note("Phân công đúng chuyên ngành")
                .build();

        ReviewerAssignmentResponseDTO response = defenseService.assignReviewer(request);

        assertNotNull(response);
        assertEquals(502L, response.getReviewerId());
        assertEquals("ASSIGNED", response.getStatus());
    }

    @Test
    void testAssignReviewer_SameAsAdvisor_ThrowsException() {
        // Thesis 1 has advisor 501. Setting reviewer as 501 must violate hard constraint GVPB != GVHD
        ReviewerAssignRequestDTO request = ReviewerAssignRequestDTO.builder()
                .thesisId(1L)
                .reviewerId(501L) // Same as advisor!
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> defenseService.assignReviewer(request));

        assertTrue(ex.getMessage().contains("Giảng viên phản biện (GVPB) KHÔNG ĐƯỢC TRÙNG"));
    }

    @Test
    void testAutoGenerateSchedules() {
        when(councilRepository.findByProjectRoundId(10L)).thenReturn(List.of(
                DefenseCouncil.builder().id(1L).name("Hội đồng 1").build(),
                DefenseCouncil.builder().id(2L).name("Hội đồng 2").build()
        ));
        when(scheduleRepository.findByCouncilIdAndDefenseDateAndSession(any(), any(), any())).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(DefenseSchedule.class))).thenAnswer(i -> {
            DefenseSchedule s = i.getArgument(0);
            s.setId(10L);
            return s;
        });

        AutoScheduleRequestDTO request = AutoScheduleRequestDTO.builder()
                .projectRoundId(10L)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .rooms(List.of("Phòng 301-A1", "Phòng 302-A1"))
                .sessions(List.of("MORNING", "AFTERNOON"))
                .build();

        List<DefenseScheduleResponseDTO> result = defenseService.autoGenerateSchedules(request);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void testSubmitScore_Valid() {
        when(scoreRepository.findByThesisIdAndGraderIdAndScoreType(1L, 501L, "SUPERVISOR"))
                .thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenAnswer(i -> {
            Score s = i.getArgument(0);
            s.setId(1L);
            return s;
        });

        ScoreSubmitRequestDTO request = ScoreSubmitRequestDTO.builder()
                .thesisId(1L)
                .graderId(501L)
                .scoreType("SUPERVISOR")
                .score(BigDecimal.valueOf(8.5))
                .feedback("Sinh viên làm việc chăm chỉ, hoàn thành tốt yêu cầu")
                .build();

        ScoreResponseDTO response = defenseService.submitScore(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("8.50"), response.getScore());
    }

    @Test
    void testSubmitScore_InvalidScore_ThrowsException() {
        ScoreSubmitRequestDTO request = ScoreSubmitRequestDTO.builder()
                .thesisId(1L)
                .graderId(501L)
                .scoreType("SUPERVISOR")
                .score(BigDecimal.valueOf(11.0)) // Greater than 10
                .build();

        assertThrows(IllegalArgumentException.class, () -> defenseService.submitScore(request));
    }

    @Test
    void testSynthesizeResult() {
        Score supScore = Score.builder().scoreType("SUPERVISOR").score(BigDecimal.valueOf(8.5)).build();
        Score revScore = Score.builder().scoreType("REVIEWER").score(BigDecimal.valueOf(8.0)).build();
        Score couScore1 = Score.builder().scoreType("COUNCIL").score(BigDecimal.valueOf(9.0)).build();
        Score couScore2 = Score.builder().scoreType("COUNCIL").score(BigDecimal.valueOf(8.5)).build();

        when(scoreRepository.findByThesisId(1L)).thenReturn(List.of(supScore, revScore, couScore1, couScore2));
        when(graduationResultRepository.findByThesisId(1L)).thenReturn(Optional.empty());
        when(graduationResultRepository.save(any(GraduationResult.class))).thenAnswer(i -> {
            GraduationResult gr = i.getArgument(0);
            gr.setId(1L);
            return gr;
        });

        SynthesizeResultRequestDTO request = SynthesizeResultRequestDTO.builder()
                .thesisId(1L)
                .supervisorWeight(0.3)
                .reviewerWeight(0.2)
                .councilWeight(0.5)
                .build();

        GraduationResultResponseDTO result = defenseService.synthesizeResult(request);

        assertNotNull(result);
        assertEquals("PASSED", result.getFinalResult());
        assertNotNull(result.getFinalScore());
        assertEquals("EXCELLENT", result.getGrade());
    }
}
