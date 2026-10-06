package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.progress.dto.TaskCreateDTO;
import com.example.thesis_hub_api.progress.dto.TaskResponseDTO;
import com.example.thesis_hub_api.progress.service.ProgressReportService;
import com.example.thesis_hub_api.progress.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ProgressControllerTest {

    @Mock
    private TaskService taskService;

    @Mock
    private ProgressReportService reportService;

    @InjectMocks
    private ProgressController progressController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createTask_ReturnsOk() {
        TaskCreateDTO request = new TaskCreateDTO();
        TaskResponseDTO response = new TaskResponseDTO();
        response.setId(10L);

        when(taskService.createTask(any(TaskCreateDTO.class))).thenReturn(response);

        ResponseEntity<TaskResponseDTO> result = progressController.createTask(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(10L, result.getBody().getId());
    }
}
