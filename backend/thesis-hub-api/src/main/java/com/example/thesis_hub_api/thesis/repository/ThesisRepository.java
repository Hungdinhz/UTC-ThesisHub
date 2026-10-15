package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.Thesis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThesisRepository extends JpaRepository<Thesis, Long> {
    Optional<Thesis> findByStudentId(Long studentId);
    List<Thesis> findByLecturerId(Long lecturerId);
    List<Thesis> findByProjectRoundId(Long projectRoundId);
    List<Thesis> findByStatus(String status);
}
