package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.progress.dto.CreateTaskRequest;
import com.example.thesis_hub_api.progress.dto.TaskResponse;
import com.example.thesis_hub_api.progress.dto.UpdateTaskRequest;
import com.example.thesis_hub_api.progress.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ApiResponse<TaskResponse> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ApiResponse.success("Tạo công việc thành công", taskService.createTask(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ApiResponse.success("Cập nhật công việc thành công", taskService.updateTask(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> getTaskById(@PathVariable Long id) {
        return ApiResponse.success(taskService.getTaskById(id));
    }

    @GetMapping("/by-thesis/{thesisId}")
    public ApiResponse<List<TaskResponse>> getTasksByThesis(@PathVariable Long thesisId) {
        return ApiResponse.success(taskService.getTasksByThesis(thesisId));
    }

    @GetMapping
    public ApiResponse<Page<TaskResponse>> searchTasks(
            @RequestParam(required = false) Long thesisId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long assignedToId,
            Pageable pageable) {
        return ApiResponse.success(taskService.searchTasks(thesisId, status, priority, assignedToId, pageable));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ApiResponse.success("Xóa công việc thành công", null);
    }
}
