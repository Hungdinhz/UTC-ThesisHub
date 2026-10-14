package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByCode(String code);
    boolean existsByCode(String code);
}
