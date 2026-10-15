package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ReviewGroupCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupResponseDTO;
import com.example.thesis_hub_api.thesis.entity.ReviewGroup;
import com.example.thesis_hub_api.thesis.repository.ProposalReviewAssignmentRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupMemberRepository;
import com.example.thesis_hub_api.thesis.repository.ReviewGroupRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReviewGroupServiceTest {

    @Mock
    private ReviewGroupRepository groupRepository;

    @Mock
    private ReviewGroupMemberRepository memberRepository;

    @Mock
    private ProposalReviewAssignmentRepository assignmentRepository;

    @Mock
    private ExternalAssignmentMockService mockService;

    @InjectMocks
    private ReviewGroupService reviewGroupService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createReviewGroup_Success() {
        ReviewGroupCreateDTO request = new ReviewGroupCreateDTO();
        request.setProjectRoundId(1L);
        request.setName("Hội đồng số 1");
        List<Long> lecturers = new ArrayList<>();
        lecturers.add(101L);
        request.setLecturerIds(lecturers);

        ReviewGroup group = new ReviewGroup();
        group.setId(5L);
        group.setProjectRoundId(1L);
        group.setName("Hội đồng số 1");
        group.setStatus("ACTIVE");
        group.setCreatedAt(Instant.now());

        when(groupRepository.save(any(ReviewGroup.class))).thenReturn(group);
        when(groupRepository.findById(5L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupId(5L)).thenReturn(new ArrayList<>());

        ReviewGroupResponseDTO response = reviewGroupService.createReviewGroup(request);

        assertNotNull(response);
        assertEquals(5L, response.getId());
        assertEquals("Hội đồng số 1", response.getName());
        verify(groupRepository, times(1)).save(any(ReviewGroup.class));
        verify(memberRepository, times(1)).save(any());
    }
}
