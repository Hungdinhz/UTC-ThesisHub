package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.progress.dto.CreateTaskRequest;
import com.example.thesis_hub_api.progress.dto.TaskResponse;
import com.example.thesis_hub_api.progress.dto.UpdateTaskRequest;
import com.example.thesis_hub_api.progress.entity.Task;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import com.example.thesis_hub_api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ThesisRepository thesisRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        Thesis thesis = thesisRepository.findById(request.getThesisId())
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", request.getThesisId()));

        User createdBy = userRepository.findById(request.getCreatedById())
                .orElse(thesis.getLecturer() != null ? thesis.getLecturer().getUser() : null);
        if (createdBy == null) {
            throw new ResourceNotFoundException("User", request.getCreatedById());
        }

        User assignedTo = userRepository.findById(request.getAssignedToId())
                .orElse(thesis.getStudent() != null ? thesis.getStudent().getUser() : null);
        if (assignedTo == null) {
            throw new ResourceNotFoundException("User", request.getAssignedToId());
        }

        Task task = Task.builder()
                .thesis(thesis)
                .createdBy(createdBy)
                .assignedTo(assignedTo)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("TODO")
                .dueDate(request.getDueDate())
                .build();

        Task savedTask = taskRepository.save(task);

        // Gửi thông báo nội bộ cho người được giao nhiệm vụ
        if (assignedTo.getId() != null) {
            try {
                String thesisTitle = (thesis.getTitleVn() != null) ? thesis.getTitleVn() : (thesis.getTitleEn() != null ? thesis.getTitleEn() : "Đồ án");
                notificationService.createNotification(
                        assignedTo.getId(),
                        "Nhiệm vụ mới: " + savedTask.getTitle(),
                        "GVHD đã giao nhiệm vụ mới cho bạn trên đề tài: \"" + thesisTitle + "\".",
                        "TASK",
                        "/progress/tasks"
                );
            } catch (Exception e) {
                log.warn("Không thể tạo thông báo cho Task {}: {}", savedTask.getId(), e.getMessage());
            }
        }

        return mapToResponse(savedTask);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if ("COMPLETED".equals(request.getStatus()) && task.getCompletedAt() == null) {
                task.setCompletedAt(Instant.now());
            }
        }
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getCompletedAt() != null) task.setCompletedAt(request.getCompletedAt());

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByThesis(Long thesisId) {
        return taskRepository.findByThesisId(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TaskResponse> searchTasks(Long thesisId, String status, String priority, Long assignedToId, Pageable pageable) {
        return taskRepository.searchTasks(thesisId, status, priority, assignedToId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task", id);
        }
        taskRepository.deleteById(id);
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .thesisId(task.getThesis().getId())
                .thesisTitle(task.getThesis().getTitleVn())
                .createdById(task.getCreatedBy().getId())
                .createdByFullName(task.getCreatedBy().getFullName())
                .assignedToId(task.getAssignedTo().getId())
                .assignedToFullName(task.getAssignedTo().getFullName())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .submissionCount(task.getSubmissions() != null ? task.getSubmissions().size() : 0)
                .commentCount(task.getComments() != null ? task.getComments().size() : 0)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
