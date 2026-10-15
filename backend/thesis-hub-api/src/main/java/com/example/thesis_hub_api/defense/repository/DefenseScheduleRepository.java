package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.DefenseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for DefenseSchedule.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface DefenseScheduleRepository extends JpaRepository<DefenseSchedule, Long> {

    List<DefenseSchedule> findByCouncilId(Long councilId);

    List<DefenseSchedule> findByDefenseDate(LocalDate defenseDate);

    List<DefenseSchedule> findByDefenseDateAndSession(LocalDate defenseDate, String session);

    List<DefenseSchedule> findByRoomAndDefenseDate(String room, LocalDate defenseDate);

    Optional<DefenseSchedule> findByCouncilIdAndDefenseDateAndSession(Long councilId, LocalDate defenseDate, String session);

    List<DefenseSchedule> findByStatus(String status);
}
