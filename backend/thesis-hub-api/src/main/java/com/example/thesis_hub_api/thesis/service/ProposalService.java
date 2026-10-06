package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ProposalCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ProposalResponseDTO;
import com.example.thesis_hub_api.thesis.dto.ProposalReviewRequestDTO;
import com.example.thesis_hub_api.thesis.entity.Proposal;
import com.example.thesis_hub_api.thesis.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProposalService {

    private final ProposalRepository proposalRepository;

    @Transactional
    public ProposalResponseDTO createProposal(ProposalCreateDTO request) {
        Proposal proposal = Proposal.builder()
                .thesisId(request.getThesisId())
                .title(request.getTitle())
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .status("SUBMITTED")
                .submittedAt(Instant.now())
                .build();
        
        Proposal saved = proposalRepository.save(proposal);
        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponseDTO reviewProposal(Long id, ProposalReviewRequestDTO request) {
        Proposal proposal = proposalRepository.findById(id).orElseThrow();
        proposal.setStatus(request.getResult());
        Proposal saved = proposalRepository.save(proposal);
        return mapToResponse(saved);
    }

    public List<ProposalResponseDTO> getProposalsByStatus(String status) {
        return proposalRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProposalResponseDTO mapToResponse(Proposal proposal) {
        return ProposalResponseDTO.builder()
                .id(proposal.getId())
                .thesisId(proposal.getThesisId())
                .title(proposal.getTitle())
                .content(proposal.getContent())
                .fileUrl(proposal.getFileUrl())
                .status(proposal.getStatus())
                .version(proposal.getVersion())
                .submittedAt(proposal.getSubmittedAt())
                .createdAt(proposal.getCreatedAt())
                .build();
    }
}
