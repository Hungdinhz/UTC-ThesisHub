package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    Optional<Proposal> findByThesisId(Long thesisId);
    List<Proposal> findByStatus(String status);
}
