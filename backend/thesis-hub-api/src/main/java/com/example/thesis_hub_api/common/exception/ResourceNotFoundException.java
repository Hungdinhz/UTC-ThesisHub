package com.example.thesis_hub_api.common.exception;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(ErrorCode.RESOURCE_NOT_FOUND, String.format("%s không tồn tại với định danh: %s", resourceName, identifier));
    }

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
