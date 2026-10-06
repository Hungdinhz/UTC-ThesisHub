package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByThesisId(Long thesisId);
    List<Document> findByThesisIdAndDocType(Long thesisId, String docType);
}
