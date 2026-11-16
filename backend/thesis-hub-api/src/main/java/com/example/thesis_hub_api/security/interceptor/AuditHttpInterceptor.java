package com.example.thesis_hub_api.security.interceptor;

import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.security.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditHttpInterceptor implements HandlerInterceptor {

    public static final String ATTR_START_TIME = "_auditStartTime";
    public static final String ATTR_LOGGED_EXPLICITLY = "_auditLoggedExplicitly";

    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Pattern ID_IN_PATH = Pattern.compile("/(\\d+)(?:/|$)");

    private final AuditLogService auditLogService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(ATTR_START_TIME, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            String method = request.getMethod();
            if (method == null || !MUTATING_METHODS.contains(method.toUpperCase())) {
                return;
            }
            if (Boolean.TRUE.equals(request.getAttribute(ATTR_LOGGED_EXPLICITLY))) {
                return;
            }

            String uri = request.getRequestURI();
            if (!StringUtils.hasText(uri) || !uri.startsWith("/api/v1/")) {
                return;
            }
            // AuthService & SecurityCenterService record specialized logs with old/new diffs
            if (uri.startsWith("/api/v1/auth/login")
                    || uri.startsWith("/api/v1/auth/admin/login")
                    || uri.startsWith("/api/v1/auth/students/login")
                    || uri.startsWith("/api/v1/auth/supervisors/login")
                    || uri.startsWith("/api/v1/auth/committee-members/login")
                    || uri.startsWith("/api/v1/auth/externals/login")
                    || uri.startsWith("/api/v1/auth/refresh")
                    || uri.startsWith("/api/v1/admin/security/")) {
                return;
            }

            Long startTime = (Long) request.getAttribute(ATTR_START_TIME);
            Long executionMs = startTime != null ? (System.currentTimeMillis() - startTime) : null;

            Long actorId = null;
            String actorUsername = "anonymous";
            String actorFullName = null;
            String actorRole = null;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
                actorId = principal.getId();
                actorUsername = principal.getUsername();
                actorFullName = principal.getFullName();
                actorRole = principal.getRole();
            }

            int httpStatus = response.getStatus();
            String auditStatus = "SUCCESS";
            if (httpStatus == HttpServletResponse.SC_UNAUTHORIZED || httpStatus == HttpServletResponse.SC_FORBIDDEN) {
                auditStatus = "BLOCKED";
            } else if (ex != null || httpStatus >= 400) {
                auditStatus = "FAILED";
            }

            RouteMetadata meta = classifyRoute(method.toUpperCase(), uri);
            if ("BLOCKED".equals(auditStatus) && "INFO".equals(meta.severity)) {
                meta = new RouteMetadata(meta.moduleName, meta.actionType, meta.targetEntity, meta.summary, "HIGH");
            }

            String targetId = extractTargetId(uri);
            String ip = extractClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            String errorMsg = ex != null ? ex.getMessage() : (httpStatus >= 400 ? "HTTP " + httpStatus : null);

            auditLogService.recordLog(
                    actorId,
                    actorUsername,
                    actorFullName,
                    actorRole,
                    meta.actionType,
                    meta.moduleName,
                    meta.targetEntity,
                    targetId,
                    meta.summary + (targetId != null ? " (#" + targetId + ")" : ""),
                    null,
                    null,
                    method.toUpperCase(),
                    uri,
                    ip,
                    userAgent,
                    meta.severity,
                    auditStatus,
                    errorMsg,
                    executionMs
            );
        } catch (Exception e) {
            log.debug("AuditHttpInterceptor error ignored: {}", e.getMessage());
        }
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private String extractTargetId(String uri) {
        Matcher matcher = ID_IN_PATH.matcher(uri);
        String lastId = null;
        while (matcher.find()) {
            lastId = matcher.group(1);
        }
        return lastId;
    }

    private RouteMetadata classifyRoute(String method, String uri) {
        if (uri.contains("/auth/logout")) {
            return new RouteMetadata("AUTH_SECURITY", "LOGOUT", "User", "Đăng xuất khỏi hệ thống", "INFO");
        }
        if (uri.contains("/auth/change-password")) {
            return new RouteMetadata("AUTH_SECURITY", "PASSWORD_CHANGE", "User", "Đổi mật khẩu tài khoản", "INFO");
        }
        if (uri.contains("/auth/admin/register")) {
            return new RouteMetadata("AUTH_SECURITY", "ADMIN_REGISTER", "User", "Đăng ký tài khoản Quản trị viên", "CRITICAL");
        }
        if (uri.startsWith("/api/v1/users")) {
            if (uri.contains("/role")) return new RouteMetadata("USER_ORG", "UPDATE_USER_ROLE", "User", "Thay đổi vai trò phân quyền người dùng", "HIGH");
            if (uri.contains("/status")) return new RouteMetadata("USER_ORG", "UPDATE_USER_STATUS", "User", "Khóa hoặc mở khóa tài khoản người dùng", "HIGH");
            if (uri.contains("/reset-password")) return new RouteMetadata("USER_ORG", "RESET_USER_PASSWORD", "User", "Đặt lại mật khẩu người dùng", "HIGH");
            return new RouteMetadata("USER_ORG", method + "_USER", "User", "Thao tác quản lý tài khoản người dùng", "INFO");
        }
        if (uri.startsWith("/api/v1/organization") || uri.startsWith("/api/v1/students") || uri.startsWith("/api/v1/lecturers")
                || uri.startsWith("/api/v1/faculties") || uri.startsWith("/api/v1/departments") || uri.startsWith("/api/v1/majors")) {
            return new RouteMetadata("USER_ORG", method + "_ORG_DATA", "Organization", "Cập nhật dữ liệu tổ chức / Khoa / Giảng viên / Sinh viên", "INFO");
        }
        if (uri.startsWith("/api/v1/project-rounds") || uri.startsWith("/api/v1/academic-records") || uri.startsWith("/api/v1/milestones")) {
            if (uri.contains("/status") || uri.contains("/advance")) {
                return new RouteMetadata("PROJECT_ROUND", "UPDATE_ROUND_PHASE", "ProjectRound", "Thay đổi trạng thái hoặc chuyển giai đoạn Đợt đồ án", "HIGH");
            }
            if (uri.contains("/import")) {
                return new RouteMetadata("PROJECT_ROUND", "IMPORT_ACADEMIC_DATA", "ProjectRound", "Import dữ liệu sinh viên / học vụ vào Đợt đồ án", "WARNING");
            }
            return new RouteMetadata("PROJECT_ROUND", method + "_PROJECT_ROUND", "ProjectRound", "Cập nhật thông tin Đợt đồ án / Mốc thời gian", "INFO");
        }
        if (uri.startsWith("/api/v1/assignments") || uri.startsWith("/api/v1/preferences") || uri.startsWith("/api/v1/directions")) {
            if (uri.contains("/override")) return new RouteMetadata("ASSIGNMENT", "OVERRIDE_ASSIGNMENT", "SupervisorAssignment", "Điều chỉnh thủ công kết quả phân công GVHD", "WARNING");
            if (uri.contains("/finalize")) return new RouteMetadata("ASSIGNMENT", "FINALIZE_ASSIGNMENT", "SupervisorAssignment", "Chốt kết quả phân công GVHD", "HIGH");
            if (uri.contains("/generate")) return new RouteMetadata("ASSIGNMENT", "RUN_ASSIGNMENT_CSP", "SupervisorAssignment", "Chạy thuật toán phân công GVHD", "INFO");
            return new RouteMetadata("ASSIGNMENT", method + "_ASSIGNMENT", "Assignment", "Thao tác đăng ký nguyện vọng / phân công GVHD", "INFO");
        }
        if (uri.startsWith("/api/v1/proposals") || uri.startsWith("/api/v1/theses") || uri.startsWith("/api/v1/review-groups")) {
            if (uri.contains("/defense-eligible")) {
                return new RouteMetadata("ELIGIBILITY_RESERVATION", "TOGGLE_DEFENSE_ELIGIBLE", "Thesis", "Cập nhật trạng thái đủ điều kiện bảo vệ của đề tài", "HIGH");
            }
            return new RouteMetadata("THESIS_PROPOSAL", method + "_THESIS", "Thesis", "Thao tác đề cương và đề tài đồ án", "INFO");
        }
        if (uri.startsWith("/api/v1/tasks") || uri.startsWith("/api/v1/submissions") || uri.startsWith("/api/v1/progress-reports")) {
            return new RouteMetadata("PROGRESS_TASK", method + "_PROGRESS", "Task", "Cập nhật nhiệm vụ, nộp bài hoặc báo cáo tiến độ", "INFO");
        }
        if (uri.startsWith("/api/v1/eligibility")) {
            if (uri.contains("/force-approve")) return new RouteMetadata("ELIGIBILITY_RESERVATION", "FORCE_APPROVE", "StudentProjectRound", "Duyệt đặc cách (Force Approve) điều kiện đồ án", "HIGH");
            if (uri.contains("/disqualify")) return new RouteMetadata("ELIGIBILITY_RESERVATION", "DISQUALIFY_STUDENT", "StudentProjectRound", "Loại sinh viên khỏi đợt đồ án", "HIGH");
            if (uri.contains("/review")) return new RouteMetadata("ELIGIBILITY_RESERVATION", "REVIEW_RESERVATION", "ReservationRequest", "Phê duyệt / Từ chối đơn xin bảo lưu đồ án", "HIGH");
            if (uri.contains("/reservations/admin")) return new RouteMetadata("ELIGIBILITY_RESERVATION", "ADMIN_CREATE_RESERVATION", "ReservationRequest", "Khoa lập quyết định bảo lưu đồ án cho sinh viên", "HIGH");
            if (uri.contains("/reservations")) return new RouteMetadata("ELIGIBILITY_RESERVATION", "SUBMIT_RESERVATION", "ReservationRequest", "Nộp / cập nhật đơn xin bảo lưu đồ án", "WARNING");
            return new RouteMetadata("ELIGIBILITY_RESERVATION", method + "_ELIGIBILITY", "Eligibility", "Kiểm tra & cập nhật điều kiện bảo vệ", "INFO");
        }
        if (uri.startsWith("/api/v1/defense")) {
            if (uri.contains("/finalize-and-publish") || uri.contains("/publish")) {
                return new RouteMetadata("DEFENSE_SCORING", "PUBLISH_FINAL_RESULTS", "GraduationResult", "Công bố & Khóa sổ điểm tốt nghiệp cuối kỳ", "CRITICAL");
            }
            if (uri.contains("/scores") || uri.contains("/score")) {
                return new RouteMetadata("DEFENSE_SCORING", "SUBMIT_SCORE", "Score", "Nhập / Chỉnh sửa điểm bảo vệ đồ án", "HIGH");
            }
            if (uri.contains("/synthesize")) {
                return new RouteMetadata("DEFENSE_SCORING", "SYNTHESIZE_RESULT", "GraduationResult", "Tổng hợp điểm tốt nghiệp đề tài", "HIGH");
            }
            if (uri.contains("/councils/generate") || uri.contains("/schedule")) {
                return new RouteMetadata("DEFENSE_SCORING", "DEFENSE_PLANNING", "DefenseCouncil", "Thành lập Hội đồng / Xếp lịch bảo vệ", "INFO");
            }
            return new RouteMetadata("DEFENSE_SCORING", method + "_DEFENSE", "Defense", "Thao tác phân hệ Bảo vệ & Chấm điểm", "INFO");
        }
        if (uri.startsWith("/api/v1/files")) {
            return new RouteMetadata("FILE_STORAGE", method + "_FILE", "StoredFile", "Tải lên / Xóa tệp đính kèm hệ thống", "INFO");
        }
        return new RouteMetadata("SYSTEM", method + "_RESOURCE", "System", "Thao tác API " + method + " " + uri, "INFO");
    }

    private record RouteMetadata(String moduleName, String actionType, String targetEntity, String summary, String severity) {
    }
}
