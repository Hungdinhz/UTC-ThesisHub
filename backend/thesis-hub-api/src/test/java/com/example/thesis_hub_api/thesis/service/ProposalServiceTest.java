package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ProposalCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ProposalResponseDTO;
import com.example.thesis_hub_api.thesis.dto.ProposalReviewRequestDTO;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProposalServiceTest {

    @Mock
    private ProposalRepository proposalRepository;

    @InjectMocks
    private ProposalService proposalService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createProposal_Success() {
        ProposalCreateDTO request = new ProposalCreateDTO();
        request.setThesisId(1L);
        request.setTitle("Đề cương chi tiết");

        Proposal proposal = new Proposal();
        proposal.setId(10L);
        proposal.setThesisId(1L);
        proposal.setTitle("Đề cương chi tiết");
        proposal.setStatus("SUBMITTED");
        proposal.setCreatedAt(Instant.now());

        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);

        ProposalResponseDTO response = proposalService.createProposal(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("SUBMITTED", response.getStatus());
        verify(proposalRepository, times(1)).save(any(Proposal.class));
    }

    @Test
    void reviewProposal_Success() {
        ProposalReviewRequestDTO request = new ProposalReviewRequestDTO();
        request.setResult("APPROVED");
        request.setFeedback("Tốt");

        Proposal proposal = new Proposal();
        proposal.setId(10L);
        proposal.setStatus("SUBMITTED");

        when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(proposal);

        ProposalResponseDTO response = proposalService.reviewProposal(10L, request);

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(proposalRepository, times(1)).save(any(Proposal.class));
    }
}
