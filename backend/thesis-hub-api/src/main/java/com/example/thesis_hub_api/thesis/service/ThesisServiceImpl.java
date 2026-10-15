package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.thesis.dto.ThesisResponse;
import com.example.thesis_hub_api.thesis.dto.UpdateThesisRequest;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThesisServiceImpl implements ThesisService {

    private final ThesisRepository thesisRepository;

    @Override
    @Transactional(readOnly = true)
    public ThesisResponse getThesisById(Long id) {
        Thesis thesis = thesisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", id));
        return mapToResponse(thesis);
    }

    @Override
    @Transactional(readOnly = true)
    public ThesisResponse getThesisByStudentAndRound(Long studentId, Long roundId) {
        Thesis thesis = thesisRepository.findByStudentIdAndProjectRoundId(studentId, roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề tài không tồn tại cho sinh viên và đợt này"));
        return mapToResponse(thesis);
    }

    @Override
    @Transactional(readOnly = true)
    public ThesisResponse getThesisByCode(String code) {
        Thesis thesis = thesisRepository.findByThesisCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", code));
        return mapToResponse(thesis);
    }

    @Override
    @Transactional
    public ThesisResponse updateThesis(Long id, UpdateThesisRequest request) {
        Thesis thesis = thesisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", id));

        if (request.getTitleVn() != null) thesis.setTitleVn(request.getTitleVn());
        if (request.getTitleEn() != null) thesis.setTitleEn(request.getTitleEn());
        if (request.getDescription() != null) thesis.setDescription(request.getDescription());
        if (request.getObjectives() != null) thesis.setObjectives(request.getObjectives());
        if (request.getScope() != null) thesis.setScope(request.getScope());
        if (request.getTechnologies() != null) thesis.setTechnologies(request.getTechnologies());
        if (request.getStatus() != null) thesis.setStatus(request.getStatus());
        if (request.getCompletionRate() != null) thesis.setCompletionRate(request.getCompletionRate());
        if (request.getDefenseEligible() != null) thesis.setDefenseEligible(request.getDefenseEligible());

        return mapToResponse(thesisRepository.save(thesis));
    }

    @Override
    @Transactional
    public ThesisResponse updateCompletionRate(Long id, BigDecimal rate) {
        Thesis thesis = thesisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", id));

        thesis.setCompletionRate(rate);
        return mapToResponse(thesisRepository.save(thesis));
    }

    @Override
    @Transactional
    public ThesisResponse setDefenseEligible(Long id, boolean eligible) {
        Thesis thesis = thesisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", id));

        thesis.setDefenseEligible(eligible);
        if (eligible && "IN_PROGRESS".equals(thesis.getStatus())) {
            thesis.setStatus("DEFENSE_READY");
        }
        return mapToResponse(thesisRepository.save(thesis));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ThesisResponse> searchTheses(Long roundId, Long lecturerId, String status, Boolean defenseEligible, String search, Pageable pageable) {
        return thesisRepository.searchTheses(roundId, lecturerId, status, defenseEligible, search, pageable)
                .map(this::mapToResponse);
    }

    private ThesisResponse mapToResponse(Thesis thesis) {
        String studentName = thesis.getStudent().getUser() != null ? thesis.getStudent().getUser().getFullName() : null;
        String lecturerName = thesis.getLecturer().getUser() != null ? thesis.getLecturer().getUser().getFullName() : null;

        return ThesisResponse.builder()
                .id(thesis.getId())
                .proposalId(thesis.getProposal() != null ? thesis.getProposal().getId() : null)
                .projectRoundId(thesis.getProjectRound().getId())
                .projectRoundName(thesis.getProjectRound().getName())
                .studentId(thesis.getStudent().getId())
                .studentCode(thesis.getStudent().getStudentCode())
                .studentFullName(studentName)
                .studentClass(thesis.getStudent().getClassName())
                .lecturerId(thesis.getLecturer().getId())
                .lecturerCode(thesis.getLecturer().getLecturerCode())
                .lecturerFullName(lecturerName)
                .lecturerDegree(thesis.getLecturer().getAcademicDegree())
                .thesisCode(thesis.getThesisCode())
                .titleVn(thesis.getTitleVn())
                .titleEn(thesis.getTitleEn())
                .description(thesis.getDescription())
                .objectives(thesis.getObjectives())
                .scope(thesis.getScope())
                .technologies(thesis.getTechnologies())
                .status(thesis.getStatus())
                .completionRate(thesis.getCompletionRate())
                .defenseEligible(thesis.getDefenseEligible())
                .createdAt(thesis.getCreatedAt())
                .updatedAt(thesis.getUpdatedAt())
                .build();
    }
}
