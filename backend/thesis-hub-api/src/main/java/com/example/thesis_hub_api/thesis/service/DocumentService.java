package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.CreateDocumentRequest;
import com.example.thesis_hub_api.thesis.dto.DocumentResponse;

import java.util.List;

public interface DocumentService {

    DocumentResponse addDocument(Long thesisId, Long uploaderId, CreateDocumentRequest request);

    List<DocumentResponse> getDocumentsByThesis(Long thesisId);

    DocumentResponse getDocumentById(Long id);

    void deleteDocument(Long id);
}
