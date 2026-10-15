package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ReviewGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewGroupMemberRepository extends JpaRepository<ReviewGroupMember, Long> {

    List<ReviewGroupMember> findByReviewGroupId(Long reviewGroupId);

    List<ReviewGroupMember> findByLecturerId(Long lecturerId);

    Optional<ReviewGroupMember> findByReviewGroupIdAndLecturerId(Long reviewGroupId, Long lecturerId);

    boolean existsByReviewGroupIdAndLecturerId(Long reviewGroupId, Long lecturerId);

    void deleteByReviewGroupIdAndLecturerId(Long reviewGroupId, Long lecturerId);
}
