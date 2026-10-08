package com.example.thesis_hub_api.defense.service;

import com.example.thesis_hub_api.defense.dto.GraduationResultResponseDTO;
import com.example.thesis_hub_api.defense.dto.SynthesizeResultRequestDTO;
import com.example.thesis_hub_api.defense.entity.GraduationResult;
import com.example.thesis_hub_api.defense.entity.Score;
import com.example.thesis_hub_api.defense.repository.GraduationResultRepository;
import com.example.thesis_hub_api.defense.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class ScoreCalculationTest {

    @Mock
    private ScoreRepository scoreRepository;
    
    @Mock
    private GraduationResultRepository graduationResultRepository;

    @InjectMocks
    private DefenseService defenseService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSynthesizeResult_Excellent() {
        Score sup = Score.builder().scoreType("SUPERVISOR").score(new BigDecimal("9.0")).build();
        Score rev = Score.builder().scoreType("REVIEWER").score(new BigDecimal("8.5")).build();
        Score c1 = Score.builder().scoreType("COUNCIL").score(new BigDecimal("9.0")).build();
        Score c2 = Score.builder().scoreType("COUNCIL").score(new BigDecimal("8.5")).build();
        
        when(scoreRepository.findByThesisId(1L)).thenReturn(Arrays.asList(sup, rev, c1, c2));
        when(graduationResultRepository.findByThesisId(1L)).thenReturn(Optional.empty());
        when(graduationResultRepository.save(any(GraduationResult.class))).thenAnswer(i -> i.getArgument(0));

        SynthesizeResultRequestDTO req = new SynthesizeResultRequestDTO();
        req.setThesisId(1L);
        req.setSupervisorWeight(0.3);
        req.setReviewerWeight(0.2);
        req.setCouncilWeight(0.5);

        // Calculation: 9*0.3 + 8.5*0.2 + 8.75*0.5 = 2.7 + 1.7 + 4.375 = 8.775 ~ 8.78
        GraduationResultResponseDTO res = defenseService.synthesizeResult(req);
        
        assertEquals(new BigDecimal("8.78"), res.getFinalScore());
        assertEquals("EXCELLENT", res.getGrade());
        assertEquals("PASSED", res.getFinalResult());
    }

    @Test
    void testSynthesizeResult_Failed() {
        Score sup = Score.builder().scoreType("SUPERVISOR").score(new BigDecimal("4.0")).build();
        Score rev = Score.builder().scoreType("REVIEWER").score(new BigDecimal("4.0")).build();
        Score c1 = Score.builder().scoreType("COUNCIL").score(new BigDecimal("4.5")).build();
        
        when(scoreRepository.findByThesisId(2L)).thenReturn(Arrays.asList(sup, rev, c1));
        when(graduationResultRepository.findByThesisId(2L)).thenReturn(Optional.empty());
        when(graduationResultRepository.save(any(GraduationResult.class))).thenAnswer(i -> i.getArgument(0));

        SynthesizeResultRequestDTO req = new SynthesizeResultRequestDTO();
        req.setThesisId(2L);
        req.setSupervisorWeight(0.3);
        req.setReviewerWeight(0.2);
        req.setCouncilWeight(0.5);

        // Calculation: 4*0.3 + 4*0.2 + 4.5*0.5 = 1.2 + 0.8 + 2.25 = 4.25
        GraduationResultResponseDTO res = defenseService.synthesizeResult(req);
        
        assertEquals(new BigDecimal("4.25"), res.getFinalScore());
        assertEquals("AVERAGE", res.getGrade());
        assertEquals("FAILED", res.getFinalResult());
    }
}
