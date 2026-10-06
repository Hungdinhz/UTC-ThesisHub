package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.ReviewGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewGroupMemberRepository extends JpaRepository<ReviewGroupMember, Long> {
    List<ReviewGroupMember> findByGroupId(Long groupId);
    List<ReviewGroupMember> findByLecturerId(Long lecturerId);
}
