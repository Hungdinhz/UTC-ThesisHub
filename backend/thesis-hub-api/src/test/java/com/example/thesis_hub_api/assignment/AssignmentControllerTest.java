package com.example.thesis_hub_api.assignment;

import com.example.thesis_hub_api.assignment.controller.AssignmentController;
import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.service.AssignmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Assignment Controller Unit Tests")
class AssignmentControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AssignmentService assignmentService;

    @InjectMocks
    private AssignmentController assignmentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(assignmentController)
                .setCustomArgumentResolvers(new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/v1/assignments/generate: executes algorithm and returns proposals")
    void testGenerateAssignments() throws Exception {
        AssignmentGenerateRequestDTO req = AssignmentGenerateRequestDTO.builder()
                .projectRoundId(10L)
                .reassignAll(true)
                .build();

        SupervisorAssignmentResponseDTO proposal = SupervisorAssignmentResponseDTO.builder()
                .id(1L)
                .studentId(201L)
                .studentCode("SV201")
                .lecturerId(301L)
                .lecturerName("TS. Nguyễn Văn Hướng")
                .matchedPriority(1)
                .status("PROPOSED")
                .build();

        when(assignmentService.generateAssignments(any())).thenReturn(Collections.singletonList(proposal));

        mockMvc.perform(post("/api/v1/assignments/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].studentCode").value("SV201"))
                .andExpect(jsonPath("$.data[0].matchedPriority").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/assignments/proposals: returns proposals list")
    void testGetProposals() throws Exception {
        when(assignmentService.getProposalsByRound(eq(10L), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/assignments/proposals")
                        .param("projectRoundId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/v1/assignments/{id}/override: manual override successful")
    void testOverrideAssignment() throws Exception {
        AssignmentOverrideRequestDTO req = AssignmentOverrideRequestDTO.builder()
                .newLecturerId(302L)
                .reason("Điều chuyển chuyên môn")
                .build();

        SupervisorAssignmentResponseDTO res = SupervisorAssignmentResponseDTO.builder()
                .id(5L)
                .studentId(201L)
                .lecturerId(302L)
                .isOverridden(true)
                .status("OVERRIDDEN")
                .overrideReason("Điều chuyển chuyên môn")
                .build();

        when(assignmentService.overrideAssignment(eq(5L), any(), any())).thenReturn(res);

        mockMvc.perform(put("/api/v1/assignments/5/override")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isOverridden").value(true))
                .andExpect(jsonPath("$.data.lecturerId").value(302));
    }

    @Test
    @DisplayName("POST /api/v1/assignments/finalize: finalizes assignments and returns statistics")
    void testFinalizeAssignments() throws Exception {
        AssignmentFinalizeRequestDTO req = AssignmentFinalizeRequestDTO.builder()
                .projectRoundId(10L)
                .note("Khoa chốt danh sách chính thức")
                .build();

        AssignmentStatsResponseDTO stats = AssignmentStatsResponseDTO.builder()
                .projectRoundId(10L)
                .totalStudents(50)
                .totalAssigned(50)
                .finalizedCount(50)
                .matchedNv1(40)
                .build();

        when(assignmentService.finalizeAssignments(any(), any())).thenReturn(stats);

        mockMvc.perform(post("/api/v1/assignments/finalize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.finalizedCount").value(50));
    }
}
