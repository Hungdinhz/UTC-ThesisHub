package com.example.thesis_hub_api.repository;

import com.example.thesis_hub_api.entity.ThesisTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThesisTopicRepository extends JpaRepository<ThesisTopic, Long> {
    List<ThesisTopic> findBySupervisorId(Long supervisorId);
    List<ThesisTopic> findByStudentId(Long studentId);
}
