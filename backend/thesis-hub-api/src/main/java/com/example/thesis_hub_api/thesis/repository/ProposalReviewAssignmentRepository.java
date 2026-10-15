package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ProposalReviewAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalReviewAssignmentRepository extends JpaRepository<ProposalReviewAssignment, Long> {

    Optional<ProposalReviewAssignment> findByProposalIdAndReviewGroupId(Long proposalId, Long reviewGroupId);

    List<ProposalReviewAssignment> findByProposalId(Long proposalId);

    List<ProposalReviewAssignment> findByReviewGroupId(Long reviewGroupId);

    Page<ProposalReviewAssignment> findByReviewGroupId(Long reviewGroupId, Pageable pageable);

    List<ProposalReviewAssignment> findByReviewGroupIdAndStatus(Long reviewGroupId, String status);

    boolean existsByProposalIdAndReviewGroupId(Long proposalId, Long reviewGroupId);
}
