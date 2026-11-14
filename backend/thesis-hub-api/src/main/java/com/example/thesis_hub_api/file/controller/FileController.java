package com.example.thesis_hub_api.file.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.file.dto.FileUploadResponseDTO;
import com.example.thesis_hub_api.file.entity.StoredFile;
import com.example.thesis_hub_api.file.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "File Storage", description = "API quản lý tải lên và tải xuống tập tin dùng chung")
public class FileController {

    private static final Set<String> SAFE_INLINE_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tải tập tin lên hệ thống")
    public ResponseEntity<ApiResponse<FileUploadResponseDTO>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);

        // Trả về URI tương đối để mọi máy/trình duyệt tự phân giải theo domain API hiện tại
        String fileDownloadUri = "/api/v1/files/download/" + fileName;

        FileUploadResponseDTO responseData = FileUploadResponseDTO.builder()
                .fileName(fileName)
                .fileDownloadUri(fileDownloadUri)
                .fileType(file.getContentType())
                .size(file.getSize())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Tải tập tin lên thành công", responseData));
    }

    @GetMapping("/download/{fileName:.+}")
    @Operation(summary = "Tải tập tin xuống từ hệ thống")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = fileStorageService.loadFileAsResource(fileName);

        String contentType = null;
        Optional<StoredFile> dbMeta = fileStorageService.getStoredFileMetadata(fileName);
        if (dbMeta.isPresent() && StringUtils.hasText(dbMeta.get().getContentType())) {
            contentType = dbMeta.get().getContentType();
        }

        if (!StringUtils.hasText(contentType)) {
            try {
                contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            } catch (IOException ignored) {
            }
        }

        if (!StringUtils.hasText(contentType) || "application/octet-stream".equalsIgnoreCase(contentType)) {
            contentType = fileStorageService.inferContentType(fileName);
        }

        String requestedDisposition = request.getParameter("disposition");
        boolean isSafeForInline = contentType != null && SAFE_INLINE_MIME_TYPES.contains(contentType.toLowerCase());
        boolean isInline;
        if ("attachment".equalsIgnoreCase(requestedDisposition)) {
            isInline = false;
        } else {
            isInline = isSafeForInline;
        }

        String downloadName = (dbMeta.isPresent() && StringUtils.hasText(dbMeta.get().getOriginalName()))
                ? dbMeta.get().getOriginalName()
                : (resource.getFilename() != null ? resource.getFilename() : fileName);
        String safeDownloadName = downloadName.replaceAll("[\\r\\n\"\\\\]", "_");
        String disposition = (isInline ? "inline" : "attachment") + "; filename=\"" + safeDownloadName + "\"";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox")
                .body(resource);
    }
}
