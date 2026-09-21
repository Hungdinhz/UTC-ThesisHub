package com.example.thesis_hub_api.controller;

import com.example.thesis_hub_api.entity.Comment;
import com.example.thesis_hub_api.entity.Task;
import com.example.thesis_hub_api.entity.ThesisTopic;
import com.example.thesis_hub_api.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final SupervisorService supervisorService;

    @PostMapping("/topics")
    public ResponseEntity<ThesisTopic> proposeTopic(@RequestBody ThesisTopic topic) {
        return ResponseEntity.ok(supervisorService.proposeTopic(topic));
    }

    @PutMapping("/topics/{id}/approve")
    public ResponseEntity<ThesisTopic> approveTopic(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorService.approveTopic(id));
    }

    @PostMapping("/topics/{id}/tasks")
    public ResponseEntity<Task> createTask(@PathVariable Long id, @RequestBody Task task) {
        return ResponseEntity.ok(supervisorService.createTask(id, task));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long taskId, @RequestBody Comment comment) {
        return ResponseEntity.ok(supervisorService.addComment(taskId, comment));
    }

    @PutMapping("/topics/{id}/score")
    public ResponseEntity<ThesisTopic> gradeTopic(@PathVariable Long id, @RequestParam Double score) {
        return ResponseEntity.ok(supervisorService.gradeTopic(id, score));
    }
}
