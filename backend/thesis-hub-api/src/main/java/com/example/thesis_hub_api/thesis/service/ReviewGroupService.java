package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ReviewGroupCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupMemberDTO;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupResponseDTO;
import com.example.thesis_hub_api.thesis.entity.ProposalReviewAssignment;
import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import com.example.thesis_hub_api.thesis.entity.ReviewGroupMember;
import com.example.thesis_hub_api.thesis.repository.ProposalReviewAssignmentRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupMemberRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewGroupService {

    private final ReviewGroupRepository groupRepository;
    private final ReviewGroupMemberRepository memberRepository;
    private final ProposalReviewAssignmentRepository assignmentRepository;
    private final ExternalAssignmentMockService mockService;

    @Transactional
    public ReviewGroupResponseDTO createReviewGroup(ReviewGroupCreateDTO request) {
        ReviewGroup group = ReviewGroup.builder()
                .projectRoundId(request.getProjectRoundId())
                .name(request.getName())
                .description(request.getDescription())
                .build();
        
        ReviewGroup savedGroup = groupRepository.save(group);

        if (request.getLecturerIds() != null) {
            for (Long lecturerId : request.getLecturerIds()) {
                ReviewGroupMember member = ReviewGroupMember.builder()
                        .groupId(savedGroup.getId())
                        .lecturerId(lecturerId)
                        .role("MEMBER")
                        .build();
                memberRepository.save(member);
            }
        }

        return getGroupById(savedGroup.getId());
    }

    public ReviewGroupResponseDTO getGroupById(Long id) {
        ReviewGroup group = groupRepository.findById(id).orElseThrow();
        List<ReviewGroupMember> members = memberRepository.findByGroupId(id);
        
        List<ReviewGroupMemberDTO> memberDTOs = members.stream().map(m -> {
            String lecName = mockService.getLecturer(m.getLecturerId())
                    .map(ExternalAssignmentMockService.MockLecturer::getFullName)
                    .orElse("Lecturer " + m.getLecturerId());
            return ReviewGroupMemberDTO.builder()
                    .id(m.getId())
                    .lecturerId(m.getLecturerId())
                    .lecturerName(lecName)
                    .role(m.getRole())
                    .build();
        }).collect(Collectors.toList());

        return ReviewGroupResponseDTO.builder()
                .id(group.getId())
                .projectRoundId(group.getProjectRoundId())
                .name(group.getName())
                .description(group.getDescription())
                .status(group.getStatus())
                .members(memberDTOs)
                .build();
    }
    
    @Transactional
    public void assignProposals(Long groupId, List<Long> proposalIds, Long assignedBy) {
        for (Long pid : proposalIds) {
            ProposalReviewAssignment assignment = ProposalReviewAssignment.builder()
                    .groupId(groupId)
                    .proposalId(pid)
                    .assignedBy(assignedBy)
                    .build();
            assignmentRepository.save(assignment);
        }
    }
}
