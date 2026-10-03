package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.LecturerDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LecturerDirectionRepository extends JpaRepository<LecturerDirection, Integer> {
    List<LecturerDirection> findByProjectDirectionId(Integer projectDirectionId);
    boolean existsByLecturerIdAndProjectDirectionId(Integer lecturerId, Integer projectDirectionId);
}
