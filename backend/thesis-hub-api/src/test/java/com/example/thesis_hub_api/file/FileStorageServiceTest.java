package com.example.thesis_hub_api.file;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.file.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
        fileStorageService.init();
    }

    @Test
    void testStoreFile_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test_report.pdf", "application/pdf", "Hello TheSisHub".getBytes()
        );

        String storedFileName = fileStorageService.storeFile(file);
        assertNotNull(storedFileName);
        assertTrue(storedFileName.contains("test_report.pdf"));

        Resource resource = fileStorageService.loadFileAsResource(storedFileName);
        assertTrue(resource.exists());
        assertTrue(resource.isReadable());
    }

    @Test
    void testStoreFile_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.txt", "text/plain", new byte[0]
        );

        assertThrows(AppException.class, () -> fileStorageService.storeFile(emptyFile));
    }

    @Test
    void testStoreFile_InvalidPathTraversal_ThrowsException() {
        MockMultipartFile traversalFile = new MockMultipartFile(
                "file", "../traversal.txt", "text/plain", "malicious".getBytes()
        );

        assertThrows(AppException.class, () -> fileStorageService.storeFile(traversalFile));
    }

    @Test
    void testDeleteFile_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "delete_me.txt", "text/plain", "bye".getBytes()
        );

        String storedFileName = fileStorageService.storeFile(file);
        assertTrue(fileStorageService.deleteFile(storedFileName));
    }
}
