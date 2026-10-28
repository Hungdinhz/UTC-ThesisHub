package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.DefenseScheduleThesis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface DefenseScheduleThesisRepository extends JpaRepository<DefenseScheduleThesis, Long> {
    List<DefenseScheduleThesis> findByScheduleIdOrderByDisplayOrderAscIdAsc(Long scheduleId);
    Optional<DefenseScheduleThesis> findByThesisId(Long thesisId);

    @Transactional
    void deleteByScheduleId(Long scheduleId);

    @Transactional
    void deleteByThesisId(Long thesisId);
}
