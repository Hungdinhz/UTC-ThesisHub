package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewGroupRepository extends JpaRepository<ReviewGroup, Long> {
    List<ReviewGroup> findByProjectRoundId(Long projectRoundId);
    List<ReviewGroup> findByStatus(String status);
}
