package com.example.thesis_hub_api.repository;

import com.example.thesis_hub_api.entity.Council;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouncilRepository extends JpaRepository<Council, Long> {
}
