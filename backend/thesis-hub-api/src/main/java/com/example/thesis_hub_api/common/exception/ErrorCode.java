package com.example.thesis_hub_api.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Thông tin khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1002, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    USER_EXISTED(1003, "Người dùng đã tồn tại", HttpStatus.CONFLICT),
    USERNAME_INVALID(1004, "Tên đăng nhập phải có ít nhất 3 ký tự", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1005, "Mật khẩu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Chưa xác thực danh tính", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    RESOURCE_NOT_FOUND(1008, "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    DUPLICATE_RESOURCE(1009, "Tài nguyên đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
    VALIDATION_FAILED(1010, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    FILE_STORAGE_ERROR(1011, "Lỗi khi lưu trữ hoặc đọc tập tin", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_FILE_FORMAT(1012, "Định dạng tập tin không được hỗ trợ", HttpStatus.BAD_REQUEST),
    EXCEL_PARSING_ERROR(1013, "Lỗi khi xử lý cấu trúc tập tin Excel", HttpStatus.BAD_REQUEST),
    PROJECT_ROUND_CLOSED(1014, "Đợt đồ án hiện tại đã đóng hoặc không khả dụng", HttpStatus.BAD_REQUEST),
    USER_LOCKED(1015, "Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN),
    OLD_PASSWORD_INCORRECT(1016, "Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1017, "Không tìm thấy vai trò yêu cầu", HttpStatus.NOT_FOUND),
    STUDENT_NOT_FOUND(1018, "Không tìm thấy thông tin sinh viên", HttpStatus.NOT_FOUND),
    LECTURER_NOT_FOUND(1019, "Không tìm thấy thông tin giảng viên", HttpStatus.NOT_FOUND),
    CONFIRM_PASSWORD_MISMATCH(1020, "Mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST),
    INVALID_ADMIN_SECRET_KEY(1021, "Mã bí mật xác nhận Quản trị viên (Admin API Key) không chính xác", HttpStatus.FORBIDDEN),
    NOT_AN_ADMIN_ACCOUNT(1022, "Tài khoản không có quyền truy cập vào cổng Quản trị viên", HttpStatus.FORBIDDEN);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
