package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.TaskCreateDTO;
import com.example.thesis_hub_api.progress.dto.TaskResponseDTO;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.thesis.repository.CommentRepository;
import com.example.thesis_hub_api.progress.repository.SubmissionRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
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

class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ExternalAssignmentMockService mockService;

    @InjectMocks
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createTask_Success() {
        TaskCreateDTO dto = new TaskCreateDTO();
        dto.setThesisId(1L);
        dto.setAssigneeId(10L);
        dto.setAssignerId(100L);
        dto.setTitle("Hoàn thành chương 1");

        Task task = new Task();
        task.setId(1L);
        task.setThesisId(1L);
        task.setAssigneeId(10L);
        task.setAssignerId(100L);
        task.setTitle("Hoàn thành chương 1");
        task.setStatus("TODO");
        task.setCreatedAt(Instant.now());

        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponseDTO response = taskService.createTask(dto);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("TODO", response.getStatus());
        assertEquals("Hoàn thành chương 1", response.getTitle());
    }
}
