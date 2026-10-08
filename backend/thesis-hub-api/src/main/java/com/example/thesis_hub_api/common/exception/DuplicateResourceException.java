package com.example.thesis_hub_api.common.exception;

public class DuplicateResourceException extends AppException {
    public DuplicateResourceException(String resourceName, Object identifier) {
        super(ErrorCode.DUPLICATE_RESOURCE, String.format("%s đã tồn tại với định danh: %s", resourceName, identifier));
    }

    public DuplicateResourceException(String message) {
        super(ErrorCode.DUPLICATE_RESOURCE, message);
    }
}
