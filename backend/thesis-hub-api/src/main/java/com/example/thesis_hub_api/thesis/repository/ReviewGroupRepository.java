package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewGroupRepository extends JpaRepository<ReviewGroup, Long> {

    List<ReviewGroup> findByProjectRoundId(Long projectRoundId);

    Optional<ReviewGroup> findByProjectRoundIdAndCode(Long projectRoundId, String code);

    boolean existsByProjectRoundIdAndCode(Long projectRoundId, String code);

    List<ReviewGroup> findByDepartmentId(Long departmentId);

    @Query("SELECT rg FROM ReviewGroup rg WHERE " +
           "(:roundId IS NULL OR rg.projectRound.id = :roundId) AND " +
           "(:departmentId IS NULL OR rg.department.id = :departmentId) AND " +
           "(:status IS NULL OR rg.status = :status)")
    Page<ReviewGroup> searchReviewGroups(
            @Param("roundId") Long roundId,
            @Param("departmentId") Long departmentId,
            @Param("status") String status,
            Pageable pageable);
}
