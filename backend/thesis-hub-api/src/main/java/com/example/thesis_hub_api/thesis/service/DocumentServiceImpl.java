package com.example.thesis_hub_api.thesis.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.thesis.dto.CreateDocumentRequest;
import com.example.thesis_hub_api.thesis.dto.DocumentResponse;
import com.example.thesis_hub_api.thesis.entity.Document;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.DocumentRepository;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final ThesisRepository thesisRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public DocumentResponse addDocument(Long thesisId, Long uploaderId, CreateDocumentRequest request) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", thesisId));

        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", uploaderId));

        // Mark previous documents of the same type as not latest
        List<Document> previousDocs = documentRepository.findByThesisIdAndDocumentType(thesisId, request.getDocumentType());
        int newVersion = 1;
        for (Document prev : previousDocs) {
            prev.setIsLatest(false);
            if (prev.getVersion() >= newVersion) {
                newVersion = prev.getVersion() + 1;
            }
        }
        documentRepository.saveAll(previousDocs);

        Document doc = Document.builder()
                .thesis(thesis)
                .uploader(uploader)
                .name(request.getName())
                .documentType(request.getDocumentType())
                .fileUrl(request.getFileUrl())
                .fileSize(request.getFileSize())
                .mimeType(request.getMimeType())
                .version(newVersion)
                .isLatest(true)
                .description(request.getDescription())
                .build();

        return mapToResponse(documentRepository.save(doc));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByThesis(Long thesisId) {
        return documentRepository.findByThesisId(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", id));
        return mapToResponse(doc);
    }

    @Override
    @Transactional
    public void deleteDocument(Long id) {
        if (!documentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document", id);
        }
        documentRepository.deleteById(id);
    }

    private DocumentResponse mapToResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .thesisId(doc.getThesis().getId())
                .uploaderId(doc.getUploader().getId())
                .uploaderFullName(doc.getUploader().getFullName())
                .name(doc.getName())
                .documentType(doc.getDocumentType())
                .fileUrl(doc.getFileUrl())
                .fileSize(doc.getFileSize())
                .mimeType(doc.getMimeType())
                .version(doc.getVersion())
                .isLatest(doc.getIsLatest())
                .description(doc.getDescription())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
