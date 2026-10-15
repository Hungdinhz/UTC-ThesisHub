package com.example.thesis_hub_api.common;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.exception.GlobalExceptionHandler;
import com.example.thesis_hub_api.common.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleAppException_ResourceNotFound() {
        AppException ex = new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đợt đồ án");
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleAppException(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ErrorCode.RESOURCE_NOT_FOUND.getCode(), response.getBody().getCode());
        assertEquals("Không tìm thấy đợt đồ án", response.getBody().getMessage());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    void testHandleGeneralException() {
        Exception ex = new RuntimeException("Unexpected error");
        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode(), response.getBody().getCode());
        assertFalse(response.getBody().isSuccess());
    }
}
