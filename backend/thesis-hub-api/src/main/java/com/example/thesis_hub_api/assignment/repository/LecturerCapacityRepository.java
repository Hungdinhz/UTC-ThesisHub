package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LecturerCapacityRepository extends JpaRepository<LecturerCapacity, Long> {

    Optional<LecturerCapacity> findByLecturerIdAndProjectRoundId(Long lecturerId, Long projectRoundId);

    List<LecturerCapacity> findByProjectRoundId(Long projectRoundId);

    List<LecturerCapacity> findByProjectRoundIdAndIsActiveTrue(Long projectRoundId);

    List<LecturerCapacity> findByLecturerId(Long lecturerId);
}
