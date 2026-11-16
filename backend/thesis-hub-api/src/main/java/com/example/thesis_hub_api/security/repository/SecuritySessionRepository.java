package com.example.thesis_hub_api.security.repository;

import com.example.thesis_hub_api.security.entity.SecuritySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecuritySessionRepository extends JpaRepository<SecuritySession, Long> {

    Optional<SecuritySession> findBySessionTokenId(String sessionTokenId);

    List<SecuritySession> findByStatusOrderByLastActivityAtDesc(String status);

    List<SecuritySession> findAllByOrderByIssuedAtDesc();

    List<SecuritySession> findByUserIdAndStatus(Long userId, String status);

    long countByStatus(String status);
}
