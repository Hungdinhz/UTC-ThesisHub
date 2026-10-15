package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.thesis.dto.DocumentResponseDTO;
import com.example.thesis_hub_api.thesis.dto.DocumentUploadDTO;
import com.example.thesis_hub_api.thesis.entity.Document;
import com.example.thesis_hub_api.thesis.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;

    @Transactional
    public DocumentResponseDTO uploadDocument(DocumentUploadDTO request) {
        Document document = Document.builder()
                .thesisId(request.getThesisId())
                .docType(request.getDocType())
                .fileName(request.getFileName())
                .fileUrl(request.getFileUrl())
                .fileSize(request.getFileSize())
                .uploadedBy(request.getUploadedBy())
                .build();
        
        Document saved = documentRepository.save(document);
        return mapToResponse(saved);
    }

    public List<DocumentResponseDTO> getDocumentsByThesis(Long thesisId) {
        return documentRepository.findByThesisId(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private DocumentResponseDTO mapToResponse(Document document) {
        return DocumentResponseDTO.builder()
                .id(document.getId())
                .thesisId(document.getThesisId())
                .docType(document.getDocType())
                .fileName(document.getFileName())
                .fileUrl(document.getFileUrl())
                .fileSize(document.getFileSize())
                .uploadedBy(document.getUploadedBy())
                .uploadedByName("User " + document.getUploadedBy()) // Should be fetched from identity service
                .version(document.getVersion())
                .status(document.getStatus())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
