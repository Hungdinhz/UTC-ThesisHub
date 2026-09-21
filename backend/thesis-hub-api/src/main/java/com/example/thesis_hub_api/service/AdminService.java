package com.example.thesis_hub_api.service;

import com.example.thesis_hub_api.entity.Council;
import com.example.thesis_hub_api.entity.Semester;
import com.example.thesis_hub_api.entity.ThesisTopic;
import com.example.thesis_hub_api.entity.User;
import com.example.thesis_hub_api.repository.CouncilRepository;
import com.example.thesis_hub_api.repository.SemesterRepository;
import com.example.thesis_hub_api.repository.ThesisTopicRepository;
import com.example.thesis_hub_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final CouncilRepository councilRepository;
    private final ThesisTopicRepository thesisTopicRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Semester createSemester(Semester semester) {
        return semesterRepository.save(semester);
    }

    public Council createCouncil(Council council) {
        return councilRepository.save(council);
    }

    public ThesisTopic assignSupervisor(Long topicId, Long supervisorId) {
        ThesisTopic topic = thesisTopicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        
        topic.setSupervisor(supervisor);
        return thesisTopicRepository.save(topic);
    }
}
