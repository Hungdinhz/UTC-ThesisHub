package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.LecturerDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LecturerDirectionRepository extends JpaRepository<LecturerDirection, Long> {

    List<LecturerDirection> findByLecturerId(Long lecturerId);

    List<LecturerDirection> findByLecturerIdIn(java.util.Collection<Long> lecturerIds);

    List<LecturerDirection> findByDirectionId(Long directionId);

    default List<LecturerDirection> findByProjectDirectionId(Long directionId) {
        return findByDirectionId(directionId);
    }

    Optional<LecturerDirection> findByLecturerIdAndDirectionId(Long lecturerId, Long directionId);

    boolean existsByLecturerIdAndDirectionId(Long lecturerId, Long directionId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM LecturerDirection ld WHERE ld.lecturerId = :lecturerId")
    void deleteByLecturerId(@Param("lecturerId") Long lecturerId);
}
