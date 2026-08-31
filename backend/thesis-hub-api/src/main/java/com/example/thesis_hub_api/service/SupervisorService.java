package com.example.thesis_hub_api.service;

import com.example.thesis_hub_api.entity.Comment;
import com.example.thesis_hub_api.entity.Task;
import com.example.thesis_hub_api.entity.ThesisTopic;
import com.example.thesis_hub_api.entity.User;
import com.example.thesis_hub_api.repository.CommentRepository;
import com.example.thesis_hub_api.repository.TaskRepository;
import com.example.thesis_hub_api.repository.ThesisTopicRepository;
import com.example.thesis_hub_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SupervisorService {
    private final ThesisTopicRepository topicRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username).orElseThrow();
        }
        throw new RuntimeException("Not authenticated");
    }

    public ThesisTopic proposeTopic(ThesisTopic topic) {
        topic.setSupervisor(getCurrentUser());
        topic.setStatus("PENDING");
        return topicRepository.save(topic);
    }

    public ThesisTopic approveTopic(Long topicId) {
        ThesisTopic topic = topicRepository.findById(topicId).orElseThrow();
        // Ideally check if current user is the assigned supervisor
        topic.setStatus("APPROVED");
        return topicRepository.save(topic);
    }

    public Task createTask(Long topicId, Task task) {
        ThesisTopic topic = topicRepository.findById(topicId).orElseThrow();
        task.setTopic(topic);
        return taskRepository.save(task);
    }

    public Comment addComment(Long taskId, Comment comment) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        comment.setTask(task);
        comment.setAuthor(getCurrentUser());
        return commentRepository.save(comment);
    }

    public ThesisTopic gradeTopic(Long topicId, Double score) {
        ThesisTopic topic = topicRepository.findById(topicId).orElseThrow();
        topic.setSupervisorScore(score);
        return topicRepository.save(topic);
    }
}
