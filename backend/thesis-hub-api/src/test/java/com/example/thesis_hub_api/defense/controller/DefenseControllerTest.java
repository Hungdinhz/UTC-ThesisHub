package com.example.thesis_hub_api.defense.controller;

import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.service.DefenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DefenseControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DefenseService defenseService;

    @InjectMocks
    private DefenseController defenseController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(defenseController).build();
    }

    @Test
    void testGenerateCouncils() throws Exception {
        CouncilResponseDTO councilRes = CouncilResponseDTO.builder()
                .id(1L)
                .code("HD-10-01")
                .name("Hội đồng đánh giá 1")
                .status("ACTIVE")
                .build();

        when(defenseService.generateCouncils(any(CouncilGenerationRequestDTO.class)))
                .thenReturn(List.of(councilRes));

        String json = """
                {
                    "projectRoundId": 10,
                    "maxStudentsPerCouncil": 5
                }
                """;

        mockMvc.perform(post("/api/v1/defense/councils/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].code").value("HD-10-01"));
    }

    @Test
    void testAssignReviewer() throws Exception {
        ReviewerAssignmentResponseDTO res = ReviewerAssignmentResponseDTO.builder()
                .id(1L)
                .thesisId(1L)
                .reviewerId(502L)
                .status("ASSIGNED")
                .build();

        when(defenseService.assignReviewer(any(ReviewerAssignRequestDTO.class))).thenReturn(res);

        String json = """
                {
                    "thesisId": 1,
                    "reviewerId": 502,
                    "assignedBy": 999,
                    "note": "Phan cong phan bien"
                }
                """;

        mockMvc.perform(post("/api/v1/defense/reviewers/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.reviewerId").value(502));
    }

    @Test
    void testAutoGenerateSchedules() throws Exception {
        DefenseScheduleResponseDTO schedRes = DefenseScheduleResponseDTO.builder()
                .id(1L)
                .councilId(1L)
                .defenseDate(LocalDate.now().plusDays(5))
                .session("MORNING")
                .room("Phòng 301-A1")
                .build();

        when(defenseService.autoGenerateSchedules(any(AutoScheduleRequestDTO.class)))
                .thenReturn(List.of(schedRes));

        String json = """
                {
                    "projectRoundId": 10
                }
                """;

        mockMvc.perform(post("/api/v1/defense/schedules/auto-generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].room").value("Phòng 301-A1"));
    }

    @Test
    void testSubmitScore() throws Exception {
        ScoreResponseDTO res = ScoreResponseDTO.builder()
                .id(1L)
                .thesisId(1L)
                .graderId(501L)
                .scoreType("SUPERVISOR")
                .score(BigDecimal.valueOf(9.0))
                .build();

        when(defenseService.submitScore(any(ScoreSubmitRequestDTO.class))).thenReturn(res);

        String json = """
                {
                    "thesisId": 1,
                    "graderId": 501,
                    "scoreType": "SUPERVISOR",
                    "score": 9.0,
                    "feedback": "Tot"
                }
                """;

        mockMvc.perform(post("/api/v1/defense/scores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.score").value(9.0));
    }

    @Test
    void testSynthesizeResult() throws Exception {
        GraduationResultResponseDTO res = GraduationResultResponseDTO.builder()
                .id(1L)
                .thesisId(1L)
                .finalScore(BigDecimal.valueOf(8.5))
                .grade("EXCELLENT")
                .finalResult("PASSED")
                .build();

        when(defenseService.synthesizeResult(any(SynthesizeResultRequestDTO.class))).thenReturn(res);

        String json = """
                {
                    "thesisId": 1
                }
                """;

        mockMvc.perform(post("/api/v1/defense/results/synthesize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.finalResult").value("PASSED"))
                .andExpect(jsonPath("$.data.grade").value("EXCELLENT"));
    }
}
