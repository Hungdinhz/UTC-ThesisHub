package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.ThesisCreateDTO;
import com.example.thesis_hub_api.thesis.dto.ThesisResponseDTO;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ThesisServiceTest {

    @Mock
    private ThesisRepository thesisRepository;

    @Mock
    private ExternalAssignmentMockService mockService;

    @InjectMocks
    private ThesisService thesisService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createThesis_Success() {
        ThesisCreateDTO dto = new ThesisCreateDTO();
        dto.setProjectRoundId(1L);
        dto.setStudentId(10L);
        dto.setLecturerId(100L);
        dto.setTitle("Hệ thống quản lý đồ án");

        Thesis thesis = new Thesis();
        thesis.setId(1L);
        thesis.setProjectRoundId(1L);
        thesis.setStudentId(10L);
        thesis.setLecturerId(100L);
        thesis.setTitle("Hệ thống quản lý đồ án");
        thesis.setStatus("DRAFT");
        thesis.setCreatedAt(Instant.now());

        when(thesisRepository.save(any(Thesis.class))).thenReturn(thesis);
        when(mockService.getStudent(10L)).thenReturn(Optional.empty());
        when(mockService.getLecturer(100L)).thenReturn(Optional.empty());

        ThesisResponseDTO response = thesisService.createThesis(dto);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("DRAFT", response.getStatus());
        assertEquals("Hệ thống quản lý đồ án", response.getTitle());
        verify(thesisRepository, times(1)).save(any(Thesis.class));
    }

    @Test
    void confirmByLecturer_Success() {
        Thesis thesis = new Thesis();
        thesis.setId(1L);
        thesis.setStatus("DRAFT");

        when(thesisRepository.findById(1L)).thenReturn(Optional.of(thesis));
        when(thesisRepository.save(any(Thesis.class))).thenReturn(thesis);

        ThesisResponseDTO response = thesisService.confirmByLecturer(1L);

        assertEquals("PENDING_APPROVAL", response.getStatus());
        verify(thesisRepository, times(1)).save(any(Thesis.class));
    }
}
