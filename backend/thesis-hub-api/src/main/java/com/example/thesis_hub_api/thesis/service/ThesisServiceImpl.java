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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.thesis_hub_api.thesis.repository.ProposalRepository proposalRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.thesis_hub_api.organization.repository.LecturerRepository lecturerRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.example.thesis_hub_api.progress.repository.TaskRepository taskRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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
        if (request.getDefenseEligible() != null) {
            thesis.setDefenseEligible(request.getDefenseEligible());
            if (Boolean.TRUE.equals(request.getDefenseEligible()) && !"COMPLETED".equalsIgnoreCase(thesis.getStatus())) {
                thesis.setStatus("DEFENSE_READY");
            } else if (Boolean.FALSE.equals(request.getDefenseEligible()) && "DEFENSE_READY".equalsIgnoreCase(thesis.getStatus())) {
                thesis.setStatus("IN_PROGRESS");
            }
        }

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
        if (eligible) {
            if (!"COMPLETED".equalsIgnoreCase(thesis.getStatus())) {
                thesis.setStatus("DEFENSE_READY");
            }
        } else {
            thesis.setStatus("IN_PROGRESS");
            if (jdbcTemplate != null) {
                try {
                    jdbcTemplate.update("DELETE FROM defense_schedule_theses WHERE thesis_id = ?", id);
                    jdbcTemplate.update("DELETE FROM reviewer_assignments WHERE thesis_id = ?", id);
                } catch (Exception ex) {
                    log.warn("Could not clean schedule/reviewer rows when unsetting defenseEligible for thesis {}: {}", id, ex.getMessage());
                }
            }
        }
        return mapToResponse(thesisRepository.save(thesis));
    }

    @Override
    @Transactional
    public Page<ThesisResponse> searchTheses(Long roundId, Long lecturerId, String status, Boolean defenseEligible, String search, Pageable pageable) {
        syncMissingThesesFromProposals(roundId);
        Long resolvedLecturerId = lecturerId;
        if (lecturerId != null && lecturerRepository != null && !lecturerRepository.existsById(lecturerId)) {
            resolvedLecturerId = lecturerRepository.findByUserId(lecturerId)
                    .map(com.example.thesis_hub_api.organization.entity.Lecturer::getId)
                    .orElse(lecturerId);
        }
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        return thesisRepository.searchTheses(roundId, resolvedLecturerId, status, defenseEligible, searchPattern, pageable)
                .map(this::mapToResponse);
    }

    private void syncMissingThesesFromProposals(Long roundId) {
        if (proposalRepository == null) return;
        try {
            java.util.List<com.example.thesis_hub_api.thesis.entity.Proposal> proposals =
                    (roundId != null) ? proposalRepository.findByProjectRoundId(roundId) : proposalRepository.findAll();
            for (com.example.thesis_hub_api.thesis.entity.Proposal p : proposals) {
                if (p.getStudent() == null || p.getProjectRound() == null || p.getLecturer() == null) continue;
                if ("REJECTED".equalsIgnoreCase(p.getStatus())) continue;
                boolean exists = thesisRepository.existsByStudentIdAndProjectRoundId(
                        p.getStudent().getId(), p.getProjectRound().getId());
                if (!exists) {
                    String thesisCode = "DT_" + p.getProjectRound().getRoundCode() + "_" + p.getStudent().getStudentCode();
                    Thesis thesis = Thesis.builder()
                            .proposal(p)
                            .projectRound(p.getProjectRound())
                            .student(p.getStudent())
                            .lecturer(p.getLecturer())
                            .thesisCode(thesisCode)
                            .titleVn(p.getTitleVn())
                            .titleEn(p.getTitleEn())
                            .description(p.getDescription())
                            .objectives(p.getObjectives())
                            .status("IN_PROGRESS")
                            .completionRate(BigDecimal.ZERO)
                            .defenseEligible(false)
                            .build();
                    thesisRepository.save(thesis);
                    log.info("Auto-synced missing thesis {} from existing proposal {}", thesisCode, p.getId());
                }
            }
        } catch (Exception ex) {
            log.warn("Could not auto-sync missing theses from proposals: {}", ex.getMessage());
        }
    }

    private ThesisResponse mapToResponse(Thesis thesis) {
        String studentName = (thesis.getStudent() != null && thesis.getStudent().getUser() != null) ? thesis.getStudent().getUser().getFullName() : null;
        String lecturerName = (thesis.getLecturer() != null && thesis.getLecturer().getUser() != null) ? thesis.getLecturer().getUser().getFullName() : null;

        BigDecimal effectiveCompletionRate = thesis.getCompletionRate();
        if (taskRepository != null && thesis.getId() != null) {
            try {
                java.util.List<com.example.thesis_hub_api.progress.entity.Task> tasks = taskRepository.findByThesisId(thesis.getId());
                if (!tasks.isEmpty()) {
                    long completed = tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
                    effectiveCompletionRate = BigDecimal.valueOf(Math.round((completed * 100.0) / tasks.size()));
                }
            } catch (Exception ignored) {
            }
        }

        return ThesisResponse.builder()
                .id(thesis.getId())
                .proposalId(thesis.getProposal() != null ? thesis.getProposal().getId() : null)
                .projectRoundId(thesis.getProjectRound() != null ? thesis.getProjectRound().getId() : null)
                .projectRoundName(thesis.getProjectRound() != null ? thesis.getProjectRound().getName() : null)
                .studentId(thesis.getStudent() != null ? thesis.getStudent().getId() : null)
                .studentCode(thesis.getStudent() != null ? thesis.getStudent().getStudentCode() : null)
                .studentFullName(studentName)
                .studentClass(thesis.getStudent() != null ? thesis.getStudent().getClassName() : null)
                .lecturerId(thesis.getLecturer() != null ? thesis.getLecturer().getId() : null)
                .lecturerCode(thesis.getLecturer() != null ? thesis.getLecturer().getLecturerCode() : null)
                .lecturerFullName(lecturerName)
                .lecturerDegree(thesis.getLecturer() != null ? thesis.getLecturer().getAcademicDegree() : null)
                .thesisCode(thesis.getThesisCode())
                .titleVn(thesis.getTitleVn())
                .titleEn(thesis.getTitleEn())
                .description(thesis.getDescription())
                .objectives(thesis.getObjectives())
                .scope(thesis.getScope())
                .technologies(thesis.getTechnologies())
                .status(thesis.getStatus())
                .completionRate(effectiveCompletionRate)
                .defenseEligible(thesis.getDefenseEligible())
                .createdAt(thesis.getCreatedAt())
                .updatedAt(thesis.getUpdatedAt())
                .build();
    }
}
