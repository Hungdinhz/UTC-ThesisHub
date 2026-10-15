package com.example.thesis_hub_api.common.exception;

public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message);
    }

    public UnauthorizedException() {
        super(ErrorCode.UNAUTHORIZED);
    }
}
