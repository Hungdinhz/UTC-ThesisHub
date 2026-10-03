package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LecturerCapacityRepository extends JpaRepository<LecturerCapacity, Integer> {
    Optional<LecturerCapacity> findByLecturerIdAndProjectRoundId(Integer lecturerId, Integer projectRoundId);
    List<LecturerCapacity> findByProjectRoundId(Integer projectRoundId);
}
