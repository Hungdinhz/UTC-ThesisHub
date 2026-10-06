package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ThesisApprovalDTO;
import com.example.thesis_hub_api.thesis.dto.ThesisCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ThesisResponseDTO;
import com.example.thesis_hub_api.thesis.dto.ThesisUpdateDTO;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThesisService {

    private final ThesisRepository thesisRepository;
    private final ExternalAssignmentMockService mockService;

    @Transactional
    public ThesisResponseDTO createThesis(ThesisCreateDTO request) {
        Thesis thesis = Thesis.builder()
                .projectRoundId(request.getProjectRoundId())
                .studentId(request.getStudentId())
                .lecturerId(request.getLecturerId())
                .title(request.getTitle())
                .englishTitle(request.getEnglishTitle())
                .description(request.getDescription())
                .status("DRAFT")
                .build();
        
        Thesis saved = thesisRepository.save(thesis);
        return mapToResponse(saved);
    }

    @Transactional
    public ThesisResponseDTO updateThesis(Long id, ThesisUpdateDTO request) {
        Thesis thesis = thesisRepository.findById(id).orElseThrow();
        thesis.setTitle(request.getTitle());
        thesis.setEnglishTitle(request.getEnglishTitle());
        thesis.setDescription(request.getDescription());
        return mapToResponse(thesisRepository.save(thesis));
    }

    @Transactional
    public ThesisResponseDTO confirmByLecturer(Long id) {
        Thesis thesis = thesisRepository.findById(id).orElseThrow();
        thesis.setStatus("PENDING_APPROVAL");
        return mapToResponse(thesisRepository.save(thesis));
    }

    @Transactional
    public ThesisResponseDTO approveByFaculty(Long id, ThesisApprovalDTO request) {
        Thesis thesis = thesisRepository.findById(id).orElseThrow();
        thesis.setStatus(request.getStatus());
        return mapToResponse(thesisRepository.save(thesis));
    }

    public List<ThesisResponseDTO> getTheses(Long roundId, String status) {
        List<Thesis> theses;
        if (roundId != null) {
            theses = thesisRepository.findByProjectRoundId(roundId);
        } else if (status != null) {
            theses = thesisRepository.findByStatus(status);
        } else {
            theses = thesisRepository.findAll();
        }
        return theses.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ThesisResponseDTO mapToResponse(Thesis thesis) {
        String studentName = mockService.getStudent(thesis.getStudentId())
                .map(ExternalAssignmentMockService.MockStudent::getFullName)
                .orElse("Student " + thesis.getStudentId());
                
        String lecturerName = mockService.getLecturer(thesis.getLecturerId())
                .map(ExternalAssignmentMockService.MockLecturer::getFullName)
                .orElse("Lecturer " + thesis.getLecturerId());

        return ThesisResponseDTO.builder()
                .id(thesis.getId())
                .projectRoundId(thesis.getProjectRoundId())
                .studentId(thesis.getStudentId())
                .studentName(studentName)
                .lecturerId(thesis.getLecturerId())
                .lecturerName(lecturerName)
                .title(thesis.getTitle())
                .englishTitle(thesis.getEnglishTitle())
                .description(thesis.getDescription())
                .status(thesis.getStatus())
                .createdAt(thesis.getCreatedAt())
                .updatedAt(thesis.getUpdatedAt())
                .build();
    }
}
