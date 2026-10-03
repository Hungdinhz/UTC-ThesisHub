package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.Preference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Integer> {
    List<Preference> findByDirectionRegistrationIdOrderByPriorityOrderAsc(Integer directionRegistrationId);
    List<Preference> findByDirectionRegistrationProjectRoundId(Integer projectRoundId);
    void deleteByDirectionRegistrationId(Integer directionRegistrationId);
}
