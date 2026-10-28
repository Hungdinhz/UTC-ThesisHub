package com.example.thesis_hub_api.file.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.file.entity.StoredFile;
import com.example.thesis_hub_api.file.repository.StoredFileRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.file.storage-path:./uploads}")
    private String uploadDir;

    private Path fileStorageLocation;

    @Autowired(required = false)
    private StoredFileRepository storedFileRepository;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Initialized file storage location: {}", this.fileStorageLocation);
        } catch (IOException ex) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR, "Không thể tạo thư mục lưu trữ tập tin: " + uploadDir);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Tập tin tải lên không được rỗng");
        }

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFileName.contains("..")) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR, "Tên tập tin chứa đường dẫn không hợp lệ: " + originalFileName);
        }

        String storedFileName = UUID.randomUUID() + "_" + originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_");

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = StringUtils.hasText(file.getContentType())
                    ? file.getContentType()
                    : inferContentType(originalFileName);

            boolean savedToDb = false;
            if (storedFileRepository != null) {
                try {
                    StoredFile sf = StoredFile.builder()
                            .fileName(storedFileName)
                            .originalName(originalFileName)
                            .contentType(contentType)
                            .fileSize((long) fileBytes.length)
                            .fileData(fileBytes)
                            .build();
                    storedFileRepository.save(sf);
                    savedToDb = true;
                    log.info("Saved file {} ({} bytes) to PostgreSQL stored_files", storedFileName, fileBytes.length);
                } catch (Exception dbEx) {
                    log.warn("Could not persist file {} to DB stored_files, falling back to disk: {}", storedFileName, dbEx.getMessage());
                }
            }

            if (this.fileStorageLocation != null) {
                try {
                    Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
                    Files.copy(new ByteArrayInputStream(fileBytes), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException diskEx) {
                    if (!savedToDb) {
                        throw diskEx;
                    }
                    log.warn("Could not cache file {} to local disk, DB copy succeeded", storedFileName);
                }
            }

            return storedFileName;
        } catch (IOException ex) {
            log.error("Failed to store file {}: ", originalFileName, ex);
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR, "Không thể lưu tập tin: " + originalFileName);
        }
    }

    public Optional<StoredFile> getStoredFileMetadata(String fileName) {
        if (storedFileRepository == null || !StringUtils.hasText(fileName)) {
            return Optional.empty();
        }
        try {
            return storedFileRepository.findById(fileName);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public Resource loadFileAsResource(String fileName) {
        if (storedFileRepository != null) {
            try {
                Optional<StoredFile> dbFile = storedFileRepository.findById(fileName);
                if (dbFile.isPresent() && dbFile.get().getFileData() != null) {
                    byte[] bytes = dbFile.get().getFileData();
                    return new ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return fileName;
                        }
                    };
                }
            } catch (Exception ex) {
                log.warn("Error loading file {} from DB, trying disk: {}", fileName, ex.getMessage());
            }
        }

        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Tập tin", fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Tập tin", fileName);
        }
    }

    public boolean deleteFile(String fileName) {
        boolean deletedDb = false;
        if (storedFileRepository != null) {
            try {
                if (storedFileRepository.existsById(fileName)) {
                    storedFileRepository.deleteById(fileName);
                    deletedDb = true;
                }
            } catch (Exception ignored) {
            }
        }
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            boolean deletedDisk = Files.deleteIfExists(filePath);
            return deletedDb || deletedDisk;
        } catch (IOException ex) {
            log.warn("Could not delete file {}: {}", fileName, ex.getMessage());
            return deletedDb;
        }
    }

    public String inferContentType(String fileName) {
        if (fileName == null) return "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }
}
