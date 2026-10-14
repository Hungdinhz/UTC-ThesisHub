package com.example.thesis_hub_api.projectround.repository;

import com.example.thesis_hub_api.projectround.entity.TimelineMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineMilestoneRepository extends JpaRepository<TimelineMilestone, Long> {

    List<TimelineMilestone> findByProjectRoundIdOrderByOrderIndexAscStartDateAsc(Long projectRoundId);

    void deleteByProjectRoundId(Long projectRoundId);
}
