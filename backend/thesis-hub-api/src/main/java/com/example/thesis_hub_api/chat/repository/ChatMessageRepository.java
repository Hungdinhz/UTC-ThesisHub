package com.example.thesis_hub_api.chat.repository;

import com.example.thesis_hub_api.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectRoundIdAndLecturerIdOrderByCreatedAtAscIdAsc(Long projectRoundId, Long lecturerId);
    Optional<ChatMessage> findTopByProjectRoundIdAndLecturerIdOrderByCreatedAtDescIdDesc(Long projectRoundId, Long lecturerId);
    long countByProjectRoundIdAndLecturerId(Long projectRoundId, Long lecturerId);
}
