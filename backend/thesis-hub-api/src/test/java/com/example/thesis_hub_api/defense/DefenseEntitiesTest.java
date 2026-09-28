package com.example.thesis_hub_api.defense;

import com.example.thesis_hub_api.defense.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Defense Module Entities Unit Tests - Module 4")
class DefenseEntitiesTest {

    @Test
    @DisplayName("Should create ReviewerAssignment and initialize defaults")
    void testReviewerAssignment() {
        ReviewerAssignment assignment = ReviewerAssignment.builder()
                .thesisId(301L)
                .reviewerId(15L)
                .assignedBy(1L)
                .build();

        assignment.prePersist();

        assertEquals(301L, assignment.getThesisId());
        assertEquals(15L, assignment.getReviewerId());
        assertEquals(1L, assignment.getAssignedBy());
        assertEquals("ASSIGNED", assignment.getStatus());
        assertNotNull(assignment.getAssignedAt());
        assertNotNull(assignment.getCreatedAt());
        assertNotNull(assignment.getUpdatedAt());

        assignment.setStatus("COMPLETED");
        assignment.setReviewNotes("Good presentation and structure.");
        assignment.preUpdate();

        assertEquals("COMPLETED", assignment.getStatus());
        assertEquals("Good presentation and structure.", assignment.getReviewNotes());
    }

    @Test
    @DisplayName("Should create DefenseCouncil and initialize defaults")
    void testDefenseCouncil() {
        DefenseCouncil council = DefenseCouncil.builder()
                .projectRoundId(2L)
                .name("Hội đồng bảo vệ 01 - CNPM")
                .code("HD-01-CNPM")
                .description("Hội đồng chuyên ngành Kỹ thuật phần mềm")
                .build();

        council.prePersist();

        assertEquals(2L, council.getProjectRoundId());
        assertEquals("Hội đồng bảo vệ 01 - CNPM", council.getName());
        assertEquals("HD-01-CNPM", council.getCode());
        assertEquals("ACTIVE", council.getStatus());
        assertNotNull(council.getCreatedAt());
        assertNotNull(council.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create CouncilMember with valid role and defaults")
    void testCouncilMember() {
        CouncilMember president = CouncilMember.builder()
                .councilId(10L)
                .lecturerId(25L)
                .role("PRESIDENT")
                .build();

        president.prePersist();

        assertEquals(10L, president.getCouncilId());
        assertEquals(25L, president.getLecturerId());
        assertEquals("PRESIDENT", president.getRole());
        assertTrue(president.getConfirmed());
        assertNotNull(president.getCreatedAt());
        assertNotNull(president.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create DefenseSchedule with session and max students")
    void testDefenseSchedule() {
        LocalDate date = LocalDate.of(2026, 6, 15);
        LocalTime startTime = LocalTime.of(8, 0);
        LocalTime endTime = LocalTime.of(11, 30);

        DefenseSchedule schedule = DefenseSchedule.builder()
                .councilId(10L)
                .defenseDate(date)
                .session("MORNING")
                .room("A2-301")
                .startTime(startTime)
                .endTime(endTime)
                .notes("Mang theo máy chiếu và micro")
                .build();

        schedule.prePersist();

        assertEquals(10L, schedule.getCouncilId());
        assertEquals(date, schedule.getDefenseDate());
        assertEquals("MORNING", schedule.getSession());
        assertEquals("A2-301", schedule.getRoom());
        assertEquals(12, schedule.getMaxStudents());
        assertEquals("SCHEDULED", schedule.getStatus());
        assertNotNull(schedule.getCreatedAt());
        assertNotNull(schedule.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create Score with valid value and grader")
    void testScore() {
        Score score = Score.builder()
                .thesisId(501L)
                .graderId(30L)
                .scoreType("COUNCIL")
                .score(new BigDecimal("9.25"))
                .feedback("Sinh viên trả lời tốt các câu hỏi phản biện")
                .build();

        score.prePersist();

        assertEquals(501L, score.getThesisId());
        assertEquals(30L, score.getGraderId());
        assertEquals("COUNCIL", score.getScoreType());
        assertEquals(new BigDecimal("9.25"), score.getScore());
        assertEquals("Sinh viên trả lời tốt các câu hỏi phản biện", score.getFeedback());
        assertNotNull(score.getGradedAt());
        assertNotNull(score.getCreatedAt());
        assertNotNull(score.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create GraduationResult and synthesize scores")
    void testGraduationResult() {
        GraduationResult result = GraduationResult.builder()
                .thesisId(501L)
                .supervisorScore(new BigDecimal("9.00"))
                .reviewerScore(new BigDecimal("8.50"))
                .councilScore(new BigDecimal("9.20"))
                .finalScore(new BigDecimal("8.95"))
                .grade("EXCELLENT")
                .finalResult("PASSED")
                .publishedAt(Instant.now())
                .notes("Đạt kết quả xuất sắc")
                .build();

        result.prePersist();

        assertEquals(501L, result.getThesisId());
        assertEquals(new BigDecimal("9.00"), result.getSupervisorScore());
        assertEquals(new BigDecimal("8.50"), result.getReviewerScore());
        assertEquals(new BigDecimal("9.20"), result.getCouncilScore());
        assertEquals(new BigDecimal("8.95"), result.getFinalScore());
        assertEquals("EXCELLENT", result.getGrade());
        assertEquals("PASSED", result.getFinalResult());
        assertNotNull(result.getPublishedAt());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
    }
}
