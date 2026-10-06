package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.thesis.dto.ThesisCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ThesisResponseDTO;
import com.example.thesis_hub_api.thesis.service.DocumentService;
import com.example.thesis_hub_api.thesis.service.ProposalService;
import com.example.thesis_hub_api.thesis.service.ReviewGroupService;
import com.example.thesis_hub_api.thesis.service.ThesisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ThesisControllerTest {

    @Mock
    private ThesisService thesisService;

    @Mock
    private ReviewGroupService reviewGroupService;

    @Mock
    private ProposalService proposalService;

    @Mock
    private DocumentService documentService;

    @InjectMocks
    private ThesisController thesisController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createThesis_ReturnsOk() {
        ThesisCreateDTO request = new ThesisCreateDTO();
        ThesisResponseDTO response = new ThesisResponseDTO();
        response.setId(1L);

        when(thesisService.createThesis(any(ThesisCreateDTO.class))).thenReturn(response);

        ResponseEntity<ThesisResponseDTO> result = thesisController.createThesis(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(1L, result.getBody().getId());
    }
}
