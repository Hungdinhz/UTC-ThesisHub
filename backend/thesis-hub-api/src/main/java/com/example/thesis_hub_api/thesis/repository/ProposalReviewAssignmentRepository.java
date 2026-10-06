package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ProposalReviewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalReviewAssignmentRepository extends JpaRepository<ProposalReviewAssignment, Long> {
    List<ProposalReviewAssignment> findByGroupId(Long groupId);
    List<ProposalReviewAssignment> findByProposalId(Long proposalId);
    List<ProposalReviewAssignment> findByStatus(String status);
}
