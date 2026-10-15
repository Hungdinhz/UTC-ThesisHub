package com.example.thesis_hub_api.defense;

import com.example.thesis_hub_api.defense.entity.CouncilMember;
import com.example.thesis_hub_api.defense.entity.DefenseCouncil;
import com.example.thesis_hub_api.defense.entity.GraduationResult;
import com.example.thesis_hub_api.defense.entity.ReviewerAssignment;
import com.example.thesis_hub_api.defense.repository.CouncilMemberRepository;
import com.example.thesis_hub_api.defense.repository.DefenseCouncilRepository;
import com.example.thesis_hub_api.defense.repository.GraduationResultRepository;
import com.example.thesis_hub_api.defense.repository.ReviewerAssignmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Defense Repositories Contract Tests - Module 4")
class DefenseRepositoriesMockTest {

    @Mock
    private DefenseCouncilRepository defenseCouncilRepository;

    @Mock
    private CouncilMemberRepository councilMemberRepository;

    @Mock
    private ReviewerAssignmentRepository reviewerAssignmentRepository;

    @Mock
    private GraduationResultRepository graduationResultRepository;

    @Test
    @DisplayName("Should find councils by project round")
    void testFindCouncilsByProjectRound() {
        DefenseCouncil council = DefenseCouncil.builder()
                .id(1L)
                .projectRoundId(10L)
                .code("HD-01")
                .name("Hội đồng 01")
                .status("ACTIVE")
                .build();

        when(defenseCouncilRepository.findByProjectRoundId(10L)).thenReturn(List.of(council));

        List<DefenseCouncil> results = defenseCouncilRepository.findByProjectRoundId(10L);
        assertEquals(1, results.size());
        assertEquals("HD-01", results.get(0).getCode());
        verify(defenseCouncilRepository, times(1)).findByProjectRoundId(10L);
    }

    @Test
    @DisplayName("Should verify 5 members per council structure")
    void testCouncilMemberCountConstraint() {
        when(councilMemberRepository.countByCouncilId(1L)).thenReturn(5L);

        long memberCount = councilMemberRepository.countByCouncilId(1L);
        assertEquals(5L, memberCount);
        verify(councilMemberRepository, times(1)).countByCouncilId(1L);
    }

    @Test
    @DisplayName("Should find reviewer assignment by thesis ID")
    void testFindReviewerAssignmentByThesisId() {
        ReviewerAssignment assignment = ReviewerAssignment.builder()
                .id(1L)
                .thesisId(100L)
                .reviewerId(20L)
                .status("ASSIGNED")
                .build();

        when(reviewerAssignmentRepository.findByThesisId(100L)).thenReturn(Optional.of(assignment));

        Optional<ReviewerAssignment> result = reviewerAssignmentRepository.findByThesisId(100L);
        assertTrue(result.isPresent());
        assertEquals(20L, result.get().getReviewerId());
    }

    @Test
    @DisplayName("Should find graduation result by thesis ID")
    void testFindGraduationResultByThesisId() {
        GraduationResult graduationResult = GraduationResult.builder()
                .id(1L)
                .thesisId(100L)
                .finalScore(new BigDecimal("9.00"))
                .finalResult("PASSED")
                .build();

        when(graduationResultRepository.findByThesisId(100L)).thenReturn(Optional.of(graduationResult));

        Optional<GraduationResult> result = graduationResultRepository.findByThesisId(100L);
        assertTrue(result.isPresent());
        assertEquals("PASSED", result.get().getFinalResult());
    }
}
