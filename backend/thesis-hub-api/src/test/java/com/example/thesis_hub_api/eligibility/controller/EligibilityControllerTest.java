package com.example.thesis_hub_api.eligibility.controller;

import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.service.EligibilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class EligibilityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private EligibilityService eligibilityService;

    @InjectMocks
    private EligibilityController eligibilityController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(eligibilityController).build();
    }

    @Test
    void testCheckThesisEligibility() throws Exception {
        EligibilityCheckResponseDTO mockRes = EligibilityCheckResponseDTO.builder()
                .studentId(101L)
                .status("ELIGIBLE")
                .completedCredits(120)
                .gpa(3.2)
                .build();

        when(eligibilityService.checkThesisEligibility(eq(101L), eq(10L))).thenReturn(mockRes);

        mockMvc.perform(get("/api/v1/eligibility/check")
                        .param("studentId", "101")
                        .param("projectRoundId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.studentId").value(101))
                .andExpect(jsonPath("$.data.status").value("ELIGIBLE"));
    }

    @Test
    void testForceApprove() throws Exception {
        EligibilityCheckResponseDTO mockRes = EligibilityCheckResponseDTO.builder()
                .studentId(102L)
                .status("FORCE_APPROVED")
                .build();

        when(eligibilityService.forceApprove(any(ForceApproveRequestDTO.class))).thenReturn(mockRes);

        String json = """
                {
                    "studentId": 102,
                    "projectRoundId": 10,
                    "approvedBy": 999,
                    "reason": "Duyet dac cach"
                }
                """;

        mockMvc.perform(post("/api/v1/eligibility/force-approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("FORCE_APPROVED"));
    }

    @Test
    void testDisqualify() throws Exception {
        EligibilityCheckResponseDTO mockRes = EligibilityCheckResponseDTO.builder()
                .studentId(101L)
                .status("DISQUALIFIED")
                .build();

        when(eligibilityService.disqualify(any(DisqualifyRequestDTO.class))).thenReturn(mockRes);

        String json = """
                {
                    "studentId": 101,
                    "projectRoundId": 10,
                    "disqualifiedBy": 999,
                    "reason": "Ky luat"
                }
                """;

        mockMvc.perform(post("/api/v1/eligibility/disqualify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("DISQUALIFIED"));
    }

    @Test
    void testSubmitReservation() throws Exception {
        ReservationResponseDTO mockRes = ReservationResponseDTO.builder()
                .id(1L)
                .studentId(101L)
                .status("PENDING")
                .build();

        when(eligibilityService.submitReservation(any(ReservationSubmitRequestDTO.class))).thenReturn(mockRes);

        String json = """
                {
                    "studentId": 101,
                    "thesisId": 1,
                    "projectRoundId": 10,
                    "reason": "Ly do suc khoe"
                }
                """;

        mockMvc.perform(post("/api/v1/eligibility/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void testReviewReservation() throws Exception {
        ReservationResponseDTO mockRes = ReservationResponseDTO.builder()
                .id(1L)
                .status("APPROVED")
                .reviewedBy(999L)
                .build();

        when(eligibilityService.reviewReservation(eq(1L), any(ReservationReviewRequestDTO.class))).thenReturn(mockRes);

        String json = """
                {
                    "status": "APPROVED",
                    "reviewedBy": 999,
                    "note": "Dong y"
                }
                """;

        mockMvc.perform(put("/api/v1/eligibility/reservations/1/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    void testCheckFinalDefenseEligibility() throws Exception {
        FinalDefenseEligibilityResponseDTO mockRes = FinalDefenseEligibilityResponseDTO.builder()
                .studentId(101L)
                .thesisId(1L)
                .eligibleForDefense(true)
                .build();

        when(eligibilityService.checkFinalDefenseEligibility(eq(1L), eq(101L))).thenReturn(mockRes);

        mockMvc.perform(get("/api/v1/eligibility/final-defense")
                        .param("thesisId", "1")
                        .param("studentId", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.eligibleForDefense").value(true));
    }
}
