package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.thesis.dto.CreateDocumentRequest;
import com.example.thesis_hub_api.thesis.dto.DocumentResponse;
import com.example.thesis_hub_api.thesis.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/theses")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/{thesisId}/documents")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'ADMIN')")
    public ApiResponse<DocumentResponse> addDocument(
            @PathVariable Long thesisId,
            @RequestParam Long uploaderId,
            @Valid @RequestBody CreateDocumentRequest request) {
        return ApiResponse.success("Tải lên tài liệu thành công",
                documentService.addDocument(thesisId, uploaderId, request));
    }

    @GetMapping("/{thesisId}/documents")
    public ApiResponse<List<DocumentResponse>> getDocumentsByThesis(@PathVariable Long thesisId) {
        return ApiResponse.success(documentService.getDocumentsByThesis(thesisId));
    }

    @GetMapping("/documents/{id}")
    public ApiResponse<DocumentResponse> getDocumentById(@PathVariable Long id) {
        return ApiResponse.success(documentService.getDocumentById(id));
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'ADMIN')")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ApiResponse.success("Xóa tài liệu thành công", null);
    }
}
