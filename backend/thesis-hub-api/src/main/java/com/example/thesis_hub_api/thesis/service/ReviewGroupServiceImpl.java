package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.common.exception.DuplicateResourceException;
import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.organization.entity.Department;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.repository.DepartmentRepository;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import com.example.thesis_hub_api.projectround.repository.ProjectRoundRepository;
import com.example.thesis_hub_api.thesis.dto.CreateReviewGroupRequest;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupResponse;
import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import com.example.thesis_hub_api.thesis.entity.ReviewGroupMember;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupMemberRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewGroupServiceImpl implements ReviewGroupService {

    private final ReviewGroupRepository reviewGroupRepository;
    private final ReviewGroupMemberRepository reviewGroupMemberRepository;
    private final ProjectRoundRepository projectRoundRepository;
    private final DepartmentRepository departmentRepository;
    private final LecturerRepository lecturerRepository;

    @Override
    @Transactional
    public ReviewGroupResponse createReviewGroup(CreateReviewGroupRequest request) {
        if (reviewGroupRepository.existsByProjectRoundIdAndCode(request.getProjectRoundId(), request.getCode())) {
            throw new DuplicateResourceException("Mã nhóm xét duyệt đã tồn tại trong đợt này");
        }

        ProjectRound round = projectRoundRepository.findById(request.getProjectRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("ProjectRound", request.getProjectRoundId()));

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        ReviewGroup reviewGroup = ReviewGroup.builder()
                .projectRound(round)
                .department(department)
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .status("ACTIVE")
                .members(new ArrayList<>())
                .build();

        ReviewGroup saved = reviewGroupRepository.save(reviewGroup);

        if (request.getMembers() != null && !request.getMembers().isEmpty()) {
            for (CreateReviewGroupRequest.MemberAssignmentDto mDto : request.getMembers()) {
                Lecturer lecturer = lecturerRepository.findById(mDto.getLecturerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Lecturer", mDto.getLecturerId()));

                ReviewGroupMember member = ReviewGroupMember.builder()
                        .reviewGroup(saved)
                        .lecturer(lecturer)
                        .role(mDto.getRole() != null ? mDto.getRole() : "MEMBER")
                        .build();

                reviewGroupMemberRepository.save(member);
                saved.getMembers().add(member);
            }
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewGroupResponse getReviewGroupById(Long id) {
        ReviewGroup group = reviewGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReviewGroup", id));
        return mapToResponse(group);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewGroupResponse> getReviewGroupsByRound(Long roundId) {
        return reviewGroupRepository.findByProjectRoundId(roundId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewGroupResponse addMember(Long reviewGroupId, Long lecturerId, String role) {
        ReviewGroup group = reviewGroupRepository.findById(reviewGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("ReviewGroup", reviewGroupId));

        if (reviewGroupMemberRepository.existsByReviewGroupIdAndLecturerId(reviewGroupId, lecturerId)) {
            throw new DuplicateResourceException("Giảng viên đã là thành viên của nhóm xét duyệt này");
        }

        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer", lecturerId));

        ReviewGroupMember member = ReviewGroupMember.builder()
                .reviewGroup(group)
                .lecturer(lecturer)
                .role(role != null ? role : "MEMBER")
                .build();

        reviewGroupMemberRepository.save(member);
        group.getMembers().add(member);
        return mapToResponse(group);
    }

    @Override
    @Transactional
    public void removeMember(Long reviewGroupId, Long lecturerId) {
        reviewGroupMemberRepository.deleteByReviewGroupIdAndLecturerId(reviewGroupId, lecturerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewGroupResponse> searchReviewGroups(Long roundId, Long departmentId, String status, Pageable pageable) {
        return reviewGroupRepository.searchReviewGroups(roundId, departmentId, status, pageable)
                .map(this::mapToResponse);
    }

    private ReviewGroupResponse mapToResponse(ReviewGroup group) {
        List<ReviewGroupResponse.MemberDto> memberDtos = group.getMembers() != null
                ? group.getMembers().stream().map(m -> {
                    String fullName = m.getLecturer().getUser() != null ? m.getLecturer().getUser().getFullName() : null;
                    return ReviewGroupResponse.MemberDto.builder()
                            .id(m.getId())
                            .lecturerId(m.getLecturer().getId())
                            .lecturerCode(m.getLecturer().getLecturerCode())
                            .lecturerFullName(fullName)
                            .academicDegree(m.getLecturer().getAcademicDegree())
                            .role(m.getRole())
                            .build();
                }).collect(Collectors.toList())
                : List.of();

        return ReviewGroupResponse.builder()
                .id(group.getId())
                .projectRoundId(group.getProjectRound().getId())
                .projectRoundName(group.getProjectRound().getName())
                .departmentId(group.getDepartment() != null ? group.getDepartment().getId() : null)
                .departmentName(group.getDepartment() != null ? group.getDepartment().getName() : null)
                .code(group.getCode())
                .name(group.getName())
                .description(group.getDescription())
                .status(group.getStatus())
                .members(memberDtos)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
