package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.CreateReviewGroupRequest;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewGroupService {

    ReviewGroupResponse createReviewGroup(CreateReviewGroupRequest request);

    ReviewGroupResponse getReviewGroupById(Long id);

    List<ReviewGroupResponse> getReviewGroupsByRound(Long roundId);

    ReviewGroupResponse addMember(Long reviewGroupId, Long lecturerId, String role);

    void removeMember(Long reviewGroupId, Long lecturerId);

    Page<ReviewGroupResponse> searchReviewGroups(Long roundId, Long departmentId, String status, Pageable pageable);
}
