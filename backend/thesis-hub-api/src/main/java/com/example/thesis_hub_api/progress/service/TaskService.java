package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.CreateTaskRequest;
import com.example.thesis_hub_api.progress.dto.TaskResponse;
import com.example.thesis_hub_api.progress.dto.UpdateTaskRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(CreateTaskRequest request);

    TaskResponse updateTask(Long id, UpdateTaskRequest request);

    TaskResponse getTaskById(Long id);

    List<TaskResponse> getTasksByThesis(Long thesisId);

    Page<TaskResponse> searchTasks(Long thesisId, String status, String priority, Long assignedToId, Pageable pageable);

    void deleteTask(Long id);
}
