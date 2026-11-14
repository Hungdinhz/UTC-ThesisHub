package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.thesis.dto.CreateDocumentRequest;
import com.example.thesis_hub_api.thesis.dto.DocumentResponse;
import com.example.thesis_hub_api.thesis.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/theses")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/{thesisId}/documents")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'ADMIN', 'ACADEMIC_STAFF') and @accessControl.canAccessThesis(#thesisId)")
    public ApiResponse<DocumentResponse> addDocument(
            @PathVariable Long thesisId,
            @RequestParam(required = false) Long uploaderId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateDocumentRequest request) {
        Long effectiveUploaderId = (currentUser != null && currentUser.getId() != null)
                ? currentUser.getId()
                : uploaderId;
        return ApiResponse.success("Tải lên tài liệu thành công",
                documentService.addDocument(thesisId, effectiveUploaderId, request));
    }

    @GetMapping("/{thesisId}/documents")
    @PreAuthorize("@accessControl.canAccessThesis(#thesisId)")
    public ApiResponse<List<DocumentResponse>> getDocumentsByThesis(@PathVariable Long thesisId) {
        return ApiResponse.success(documentService.getDocumentsByThesis(thesisId));
    }

    @GetMapping("/documents/{id}")
    @PreAuthorize("@accessControl.canAccessDocument(#id)")
    public ApiResponse<DocumentResponse> getDocumentById(@PathVariable Long id) {
        return ApiResponse.success(documentService.getDocumentById(id));
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'ADMIN', 'ACADEMIC_STAFF') and @accessControl.canAccessDocument(#id)")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ApiResponse.success("Xóa tài liệu thành công", null);
    }
}
