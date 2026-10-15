package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProposalService {

    ProposalResponse createProposal(CreateProposalRequest request);

    ProposalResponse updateProposal(Long id, UpdateProposalRequest request);

    ProposalResponse submitProposal(Long id);

    ProposalResponse supervisorApprove(Long id, boolean approved, String comment);

    ProposalResponse assignToReviewGroup(Long proposalId, Long reviewGroupId, Long assignedById);

    ProposalResponse reviewProposal(Long proposalId, ReviewProposalRequest request);

    ProposalResponse getProposalById(Long id);

    ProposalResponse getProposalByStudentAndRound(Long studentId, Long roundId);

    Page<ProposalResponse> searchProposals(Long roundId, Long lecturerId, String status, String search, Pageable pageable);
}
