package com.example.thesis_hub_api.security.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.security.dto.*;
import com.example.thesis_hub_api.security.entity.AuditLog;
import com.example.thesis_hub_api.security.entity.SecurityPolicy;
import com.example.thesis_hub_api.security.entity.SecuritySession;
import com.example.thesis_hub_api.security.repository.AuditLogRepository;
import com.example.thesis_hub_api.security.repository.SecurityPolicyRepository;
import com.example.thesis_hub_api.security.repository.SecuritySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityCenterService {

    private final SecuritySessionRepository sessionRepository;
    private final SecurityPolicyRepository policyRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public SecurityOverviewDTO getSecurityOverview() {
        long activeSessions = sessionRepository.countByStatus("ACTIVE");
        Instant since24h = Instant.now().minus(24, ChronoUnit.HOURS);
        long failedLogins24h = auditLogRepository.countByActionTypeAndCreatedAtAfter("LOGIN_FAILED", since24h);
        long highAlerts = auditLogRepository.countBySeverityIn(List.of("HIGH", "CRITICAL"));

        List<LockedAccountDTO> lockedAccounts = getLockedOrRiskyAccounts();
        long currentlyLocked = lockedAccounts.stream()
                .filter(a -> "TEMP_LOCKED".equals(a.getLockState()) || "PERMANENT_LOCKED".equals(a.getLockState()))
                .count();

        boolean strongPwd = getBooleanPolicy("ENFORCE_STRONG_PASSWORD", true);
        boolean lockScore = getBooleanPolicy("LOCK_SCORE_AFTER_ROUND_CLOSED", true);
        int maxFailed = getIntPolicy("MAX_FAILED_LOGIN_ATTEMPTS", 5);

        int score = 100;
        if (!strongPwd) score -= 10;
        if (!lockScore) score -= 10;
        if (maxFailed > 10 || maxFailed <= 0) score -= 8;
        if (failedLogins24h >= 10) score -= 10;
        else if (failedLogins24h >= 3) score -= 4;
        if (currentlyLocked > 0) score -= Math.min(10, (int) currentlyLocked * 2);
        score = Math.max(40, Math.min(100, score));

        String postureLabel = score >= 90 ? "TỐT (AN TOÀN CAO)" : (score >= 75 ? "TRUNG BÌNH KHÁ" : "CẦN CHÚ Ý");

        List<AuditLogResponseDTO> recentAlerts = auditLogRepository
                .findTop10BySeverityInOrderByCreatedAtDesc(List.of("HIGH", "CRITICAL", "WARNING"))
                .stream()
                .map(auditLogService::toDTO)
                .toList();

        return SecurityOverviewDTO.builder()
                .securityScore(score)
                .securityPostureLabel(postureLabel)
                .activeSessionsCount(activeSessions)
                .failedLogins24h(failedLogins24h)
                .lockedAccountsCount(currentlyLocked)
                .highSeverityAlertsCount(highAlerts)
                .strongPasswordEnforced(strongPwd)
                .scoreLockAfterCloseEnforced(lockScore)
                .recentAlerts(recentAlerts)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SecuritySessionDTO> getSessions(String status, String search) {
        List<SecuritySession> sessions;
        if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
            sessions = sessionRepository.findByStatusOrderByLastActivityAtDesc(status.trim().toUpperCase());
        } else {
            sessions = sessionRepository.findAllByOrderByIssuedAtDesc();
        }

        Instant now = Instant.now();
        String kw = StringUtils.hasText(search) ? search.trim().toLowerCase() : null;

        return sessions.stream()
                .filter(s -> kw == null
                        || (s.getUsername() != null && s.getUsername().toLowerCase().contains(kw))
                        || (s.getFullName() != null && s.getFullName().toLowerCase().contains(kw))
                        || (s.getIpAddress() != null && s.getIpAddress().toLowerCase().contains(kw))
                        || (s.getDeviceInfo() != null && s.getDeviceInfo().toLowerCase().contains(kw)))
                .map(s -> {
                    String effectiveStatus = s.getStatus();
                    if ("ACTIVE".equalsIgnoreCase(effectiveStatus) && s.getExpiresAt() != null && s.getExpiresAt().isBefore(now)) {
                        effectiveStatus = "EXPIRED";
                    }
                    return SecuritySessionDTO.builder()
                            .id(s.getId())
                            .userId(s.getUserId())
                            .username(s.getUsername())
                            .fullName(s.getFullName())
                            .roleName(s.getRoleName())
                            .ipAddress(s.getIpAddress())
                            .deviceInfo(s.getDeviceInfo())
                            .userAgent(s.getUserAgent())
                            .status(effectiveStatus)
                            .issuedAt(s.getIssuedAt())
                            .lastActivityAt(s.getLastActivityAt())
                            .expiresAt(s.getExpiresAt())
                            .revokedAt(s.getRevokedAt())
                            .revokeReason(s.getRevokeReason())
                            .build();
                })
                .toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registerLoginSession(User user, String rawAccessToken, long expirationMs, String ipAddress, String userAgent) {
        if (user == null || !StringUtils.hasText(rawAccessToken)) {
            return;
        }
        try {
            String tokenHash = hashToken(rawAccessToken);
            Instant now = Instant.now();
            SecuritySession session = SecuritySession.builder()
                    .sessionTokenId(tokenHash)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .roleName(user.getRole() != null ? user.getRole().getName() : "ROLE_STUDENT")
                    .ipAddress(StringUtils.hasText(ipAddress) ? ipAddress : "127.0.0.1")
                    .userAgent(userAgent)
                    .deviceInfo(parseDeviceInfo(userAgent))
                    .status("ACTIVE")
                    .issuedAt(now)
                    .lastActivityAt(now)
                    .expiresAt(now.plusMillis(expirationMs > 0 ? expirationMs : 86400000L))
                    .build();
            sessionRepository.save(session);
        } catch (Exception ex) {
            log.warn("Could not register login session for {}: {}", user.getUsername(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String rawAccessToken) {
        if (!StringUtils.hasText(rawAccessToken)) {
            return false;
        }
        try {
            String tokenHash = hashToken(rawAccessToken);
            return sessionRepository.findBySessionTokenId(tokenHash)
                    .map(s -> "REVOKED".equalsIgnoreCase(s.getStatus()))
                    .orElse(false);
        } catch (Exception ex) {
            return false;
        }
    }

    @Transactional
    public SecuritySessionDTO revokeSession(Long sessionId, Long adminId, String adminUsername, String reason, String ip) {
        SecuritySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phiên đăng nhập ID: " + sessionId));

        String oldStatus = session.getStatus();
        String effectiveReason = StringUtils.hasText(reason) ? reason.trim() : "Quản trị viên thu hồi phiên từ xa (Force Logout)";

        session.setStatus("REVOKED");
        session.setRevokedAt(Instant.now());
        session.setRevokedBy(adminId);
        session.setRevokeReason(effectiveReason);
        SecuritySession saved = sessionRepository.save(session);

        auditLogService.recordLog(
                adminId,
                adminUsername,
                null,
                "ROLE_ADMIN",
                "SESSION_REVOKED",
                "AUTH_SECURITY",
                "SecuritySession",
                String.valueOf(saved.getId()),
                "Thu hồi phiên đăng nhập từ xa của tài khoản " + saved.getUsername(),
                Map.of("status", oldStatus),
                Map.of("status", "REVOKED", "revokeReason", effectiveReason),
                "POST",
                "/api/v1/admin/security/sessions/" + sessionId + "/revoke",
                ip,
                null,
                "HIGH",
                "SUCCESS",
                null,
                null
        );

        return SecuritySessionDTO.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .roleName(saved.getRoleName())
                .ipAddress(saved.getIpAddress())
                .deviceInfo(saved.getDeviceInfo())
                .userAgent(saved.getUserAgent())
                .status(saved.getStatus())
                .issuedAt(saved.getIssuedAt())
                .lastActivityAt(saved.getLastActivityAt())
                .expiresAt(saved.getExpiresAt())
                .revokedAt(saved.getRevokedAt())
                .revokeReason(saved.getRevokeReason())
                .build();
    }

    @Transactional
    public int revokeAllUserSessions(Long userId, Long adminId, String adminUsername, String reason, String ip) {
        List<SecuritySession> activeSessions = sessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        String effectiveReason = StringUtils.hasText(reason) ? reason.trim() : "Thu hồi toàn bộ phiên đăng nhập của người dùng";
        Instant now = Instant.now();
        for (SecuritySession s : activeSessions) {
            s.setStatus("REVOKED");
            s.setRevokedAt(now);
            s.setRevokedBy(adminId);
            s.setRevokeReason(effectiveReason);
        }
        sessionRepository.saveAll(activeSessions);

        if (!activeSessions.isEmpty()) {
            auditLogService.recordLog(
                    adminId,
                    adminUsername,
                    null,
                    "ROLE_ADMIN",
                    "SESSION_REVOKED",
                    "AUTH_SECURITY",
                    "User",
                    String.valueOf(userId),
                    "Thu hồi " + activeSessions.size() + " phiên đăng nhập đang hoạt động của user ID " + userId,
                    Map.of("activeCount", activeSessions.size()),
                    Map.of("status", "REVOKED", "revokeReason", effectiveReason),
                    "POST",
                    "/api/v1/admin/security/users/" + userId + "/revoke-sessions",
                    ip,
                    null,
                    "HIGH",
                    "SUCCESS",
                    null,
                    null
            );
        }
        return activeSessions.size();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordFailedPasswordAttempt(Long userId, String ipAddress) {
        if (userId == null) return false;
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;

        User user = userOpt.get();
        int maxAttempts = getIntPolicy("MAX_FAILED_LOGIN_ATTEMPTS", 5);
        int lockMinutes = getIntPolicy("ACCOUNT_LOCKOUT_MINUTES", 15);

        int currentAttempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(currentAttempts);

        boolean lockedNow = false;
        if (maxAttempts > 0 && currentAttempts >= maxAttempts) {
            user.setLockedUntil(Instant.now().plus(lockMinutes, ChronoUnit.MINUTES));
            lockedNow = true;
        }
        userRepository.save(user);

        auditLogService.recordLog(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : null,
                lockedNow ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
                "AUTH_SECURITY",
                "User",
                String.valueOf(user.getId()),
                lockedNow
                        ? "Tài khoản " + user.getUsername() + " bị tự động khóa " + lockMinutes + " phút do nhập sai mật khẩu " + currentAttempts + " lần liên tiếp"
                        : "Đăng nhập thất bại (sai mật khẩu lần " + currentAttempts + "/" + maxAttempts + ") cho tài khoản " + user.getUsername(),
                Map.of("failedLoginAttempts", currentAttempts - 1),
                Map.of("failedLoginAttempts", currentAttempts, "lockedUntil", user.getLockedUntil() != null ? user.getLockedUntil().toString() : "none"),
                "POST",
                "/api/v1/auth/login",
                ipAddress,
                null,
                lockedNow ? "HIGH" : "WARNING",
                lockedNow ? "BLOCKED" : "FAILED",
                "Sai mật khẩu",
                null
        );

        return lockedNow;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailedPasswordAttemptsOnSuccess(Long userId, String ipAddress) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setLastLoginAt(Instant.now());
            if (StringUtils.hasText(ipAddress)) {
                user.setLastLoginIp(ipAddress);
            }
            userRepository.save(user);
        });
    }

    @Transactional(readOnly = true)
    public List<LockedAccountDTO> getLockedOrRiskyAccounts() {
        Instant now = Instant.now();
        List<User> allUsers = userRepository.findAll();
        List<LockedAccountDTO> result = new ArrayList<>();

        for (User u : allUsers) {
            boolean inactive = !Boolean.TRUE.equals(u.getIsActive());
            boolean tempLocked = u.getLockedUntil() != null && u.getLockedUntil().isAfter(now);
            int attempts = u.getFailedLoginAttempts() != null ? u.getFailedLoginAttempts() : 0;

            if (inactive || tempLocked || attempts > 0) {
                String state = inactive ? "PERMANENT_LOCKED" : (tempLocked ? "TEMP_LOCKED" : "WARNING_ATTEMPTS");
                result.add(LockedAccountDTO.builder()
                        .userId(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .roleName(u.getRole() != null ? u.getRole().getName() : "ROLE_STUDENT")
                        .isActive(u.getIsActive())
                        .failedLoginAttempts(attempts)
                        .lockedUntil(u.getLockedUntil())
                        .lastLoginAt(u.getLastLoginAt())
                        .lastLoginIp(u.getLastLoginIp())
                        .lockState(state)
                        .build());
            }
        }
        return result;
    }

    @Transactional
    public LockedAccountDTO unlockAccount(Long userId, Long adminId, String adminUsername, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Map<String, Object> oldState = Map.of(
                "isActive", Boolean.TRUE.equals(user.getIsActive()),
                "failedLoginAttempts", user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0,
                "lockedUntil", user.getLockedUntil() != null ? user.getLockedUntil().toString() : "none"
        );

        user.setIsActive(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        User saved = userRepository.save(user);

        auditLogService.recordLog(
                adminId,
                adminUsername,
                null,
                "ROLE_ADMIN",
                "ACCOUNT_UNLOCKED",
                "AUTH_SECURITY",
                "User",
                String.valueOf(saved.getId()),
                "Mở khóa bảo mật cho tài khoản " + saved.getUsername(),
                oldState,
                Map.of("isActive", true, "failedLoginAttempts", 0, "lockedUntil", "none"),
                "POST",
                "/api/v1/admin/security/accounts/" + userId + "/unlock",
                ip,
                null,
                "HIGH",
                "SUCCESS",
                null,
                null
        );

        return LockedAccountDTO.builder()
                .userId(saved.getId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .roleName(saved.getRole() != null ? saved.getRole().getName() : "ROLE_STUDENT")
                .isActive(saved.getIsActive())
                .failedLoginAttempts(0)
                .lockedUntil(null)
                .lastLoginAt(saved.getLastLoginAt())
                .lastLoginIp(saved.getLastLoginIp())
                .lockState("UNLOCKED")
                .build();
    }

    @Transactional
    public LockedAccountDTO lockAccount(Long userId, Long adminId, String adminUsername, AccountLockRequestDTO request, String ip) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        int durationMinutes = (request != null && request.getDurationMinutes() != null) ? request.getDurationMinutes() : 0;
        String reason = (request != null && StringUtils.hasText(request.getReason())) ? request.getReason().trim() : "Quản trị viên khóa tài khoản từ Trung tâm bảo mật";

        Map<String, Object> oldState = Map.of(
                "isActive", Boolean.TRUE.equals(user.getIsActive()),
                "lockedUntil", user.getLockedUntil() != null ? user.getLockedUntil().toString() : "none"
        );

        if (durationMinutes > 0) {
            user.setLockedUntil(Instant.now().plus(durationMinutes, ChronoUnit.MINUTES));
        } else {
            user.setIsActive(false);
        }
        User saved = userRepository.save(user);

        // Revoke active sessions of locked user
        revokeAllUserSessions(userId, adminId, adminUsername, "Tài khoản bị khóa: " + reason, ip);

        auditLogService.recordLog(
                adminId,
                adminUsername,
                null,
                "ROLE_ADMIN",
                "ACCOUNT_LOCKED",
                "AUTH_SECURITY",
                "User",
                String.valueOf(saved.getId()),
                "Khóa tài khoản " + saved.getUsername() + " (" + reason + ")",
                oldState,
                Map.of("isActive", saved.getIsActive(), "lockedUntil", saved.getLockedUntil() != null ? saved.getLockedUntil().toString() : "permanent", "reason", reason),
                "POST",
                "/api/v1/admin/security/accounts/" + userId + "/lock",
                ip,
                null,
                "HIGH",
                "SUCCESS",
                null,
                null
        );

        return LockedAccountDTO.builder()
                .userId(saved.getId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .roleName(saved.getRole() != null ? saved.getRole().getName() : "ROLE_STUDENT")
                .isActive(saved.getIsActive())
                .failedLoginAttempts(saved.getFailedLoginAttempts())
                .lockedUntil(saved.getLockedUntil())
                .lastLoginAt(saved.getLastLoginAt())
                .lastLoginIp(saved.getLastLoginIp())
                .lockState(durationMinutes > 0 ? "TEMP_LOCKED" : "PERMANENT_LOCKED")
                .build();
    }

    @Transactional(readOnly = true)
    public List<SecurityPolicyDTO> getPolicies() {
        List<SecurityPolicy> list = policyRepository.findAllByOrderByIdAsc();
        if (list.isEmpty()) {
            return defaultPolicies().stream().map(this::toPolicyDTO).toList();
        }
        return list.stream().map(this::toPolicyDTO).toList();
    }

    @Transactional
    public SecurityPolicyDTO updatePolicy(String policyKey, String policyValue, Long adminId, String adminUsername, String ip) {
        if (!StringUtils.hasText(policyKey) || !StringUtils.hasText(policyValue)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        SecurityPolicy policy = policyRepository.findByPolicyKey(policyKey.trim().toUpperCase())
                .orElseGet(() -> defaultPolicies().stream()
                        .filter(p -> p.getPolicyKey().equalsIgnoreCase(policyKey.trim()))
                        .findFirst()
                        .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chính sách: " + policyKey)));

        String oldVal = policy.getPolicyValue();
        policy.setPolicyValue(policyValue.trim());
        policy.setUpdatedBy(adminId);
        SecurityPolicy saved = policyRepository.save(policy);

        auditLogService.recordLog(
                adminId,
                adminUsername,
                null,
                "ROLE_ADMIN",
                "POLICY_UPDATED",
                "AUTH_SECURITY",
                "SecurityPolicy",
                saved.getPolicyKey(),
                "Cập nhật chính sách bảo mật [" + saved.getPolicyName() + "] từ '" + oldVal + "' thành '" + saved.getPolicyValue() + "'",
                Map.of("policyKey", saved.getPolicyKey(), "policyValue", oldVal),
                Map.of("policyKey", saved.getPolicyKey(), "policyValue", saved.getPolicyValue()),
                "PUT",
                "/api/v1/admin/security/policies/" + saved.getPolicyKey(),
                ip,
                null,
                "HIGH",
                "SUCCESS",
                null,
                null
        );

        return toPolicyDTO(saved);
    }

    @Transactional(readOnly = true)
    public int getIntPolicy(String key, int defaultValue) {
        return policyRepository.findByPolicyKey(key)
                .map(p -> {
                    try {
                        return Integer.parseInt(p.getPolicyValue().trim());
                    } catch (NumberFormatException ex) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public boolean getBooleanPolicy(String key, boolean defaultValue) {
        return policyRepository.findByPolicyKey(key)
                .map(p -> Boolean.parseBoolean(p.getPolicyValue().trim()))
                .orElse(defaultValue);
    }

    public List<RbacPermissionItemDTO> getRbacMatrix() {
        return List.of(
                perm("GĐ1: Đợt đồ án & Tổ chức", "Quản trị Đợt đồ án, Khoa/Bộ môn & Mốc thời gian", "Tạo/mở/đóng đợt đồ án, cấu hình danh mục tổ chức", true, false, false, false, false),
                perm("GĐ1: Học vụ", "Import danh sách SV & Lập DS đủ điều kiện nhận đồ án", "Nhập Excel kết quả học vụ và chốt danh sách sinh viên tham gia", true, true, false, false, false),
                perm("GĐ2: Phân công GVHD", "Chạy thuật toán phân công & Duyệt nguyện vọng", "Phân bổ sinh viên cho giảng viên theo chỉ tiêu & hướng nghiên cứu", true, false, false, false, false),
                perm("GĐ2: Nguyện vọng", "Đăng ký hướng đề tài & Nguyện vọng NV1–NV3", "Sinh viên chọn hướng và đề xuất giảng viên hướng dẫn", false, false, false, false, true),
                perm("GĐ3: Đề cương", "Nộp & Chỉnh sửa Đề cương đồ án", "Sinh viên cập nhật tên đề tài và đề cương chi tiết", false, false, false, false, true),
                perm("GĐ3: Duyệt đề cương", "Phê duyệt Đề cương & Xác nhận đề tài", "Giảng viên hướng dẫn / Nhóm duyệt ký xác nhận đề cương", true, false, true, true, false),
                perm("GĐ4: Tiến độ", "Giao Task, Nộp bài & Báo cáo tiến độ định kỳ", "Trao đổi hai chiều giữa GVHD và Sinh viên theo tuần", true, false, true, true, true),
                perm("GĐ5: Xét ĐK & Bảo lưu", "Xét điều kiện bảo vệ, Duyệt đặc cách & Phê duyệt Bảo lưu", "Kiểm tra điều kiện bảo vệ cuối kỳ, duyệt bảo lưu hoặc loại khỏi đợt", true, true, false, false, false),
                perm("GĐ5: Đơn bảo lưu SV", "Nộp đơn xin bảo lưu đồ án (chưa đủ tín chỉ / lý do khác)", "Sinh viên đã có đề tài gửi đơn xin bảo lưu sang đợt sau", false, false, false, false, true),
                perm("GĐ5: Hội đồng & Chấm điểm", "Thành lập Hội đồng, Xếp lịch, Nhập điểm & Xuất Biên bản PDF", "Chấm điểm phản biện/hội đồng, tổng hợp và khóa điểm cuối kỳ", true, false, true, true, false),
                perm("Hệ thống & Bảo mật", "Truy cập Trung Tâm Bảo Mật & Nhật Ký Hệ Thống (Audit Logs)", "Giám sát phiên, khóa/mở tài khoản, cấu hình chính sách & tra cứu log", true, false, false, false, false)
        );
    }

    private RbacPermissionItemDTO perm(String module, String name, String desc, boolean admin, boolean staff, boolean lec, boolean comm, boolean stu) {
        Map<String, Boolean> map = new LinkedHashMap<>();
        map.put("ROLE_ADMIN", admin);
        map.put("ROLE_ACADEMIC_STAFF", staff);
        map.put("ROLE_LECTURER", lec);
        map.put("ROLE_COMMITTEE", comm);
        map.put("ROLE_STUDENT", stu);
        return RbacPermissionItemDTO.builder()
                .module(module)
                .permissionName(name)
                .description(desc)
                .roleAccess(map)
                .build();
    }

    private SecurityPolicyDTO toPolicyDTO(SecurityPolicy entity) {
        return SecurityPolicyDTO.builder()
                .id(entity.getId())
                .policyKey(entity.getPolicyKey())
                .policyName(entity.getPolicyName())
                .policyValue(entity.getPolicyValue())
                .valueType(entity.getValueType())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private List<SecurityPolicy> defaultPolicies() {
        return List.of(
                SecurityPolicy.builder().policyKey("MAX_FAILED_LOGIN_ATTEMPTS").policyName("Giới hạn đăng nhập sai tối đa").policyValue("5").valueType("INTEGER").category("AUTHENTICATION").description("Số lần nhập sai mật khẩu liên tiếp trước khi khóa tạm thời.").build(),
                SecurityPolicy.builder().policyKey("ACCOUNT_LOCKOUT_MINUTES").policyName("Thời gian tự động khóa tài khoản (phút)").policyValue("15").valueType("INTEGER").category("AUTHENTICATION").description("Thời gian khóa tạm thời khi vượt ngưỡng đăng nhập sai.").build(),
                SecurityPolicy.builder().policyKey("JWT_EXPIRATION_HOURS").policyName("Thời hạn phiên đăng nhập JWT (giờ)").policyValue("24").valueType("INTEGER").category("SESSION").description("Thời gian hiệu lực tối đa của phiên đăng nhập.").build(),
                SecurityPolicy.builder().policyKey("ENFORCE_STRONG_PASSWORD").policyName("Bắt buộc mật khẩu mạnh").policyValue("true").valueType("BOOLEAN").category("PASSWORD").description("Yêu cầu mật khẩu tối thiểu 8 ký tự gồm chữ hoa, thường và số.").build(),
                SecurityPolicy.builder().policyKey("LOCK_SCORE_AFTER_ROUND_CLOSED").policyName("Khóa chỉnh sửa điểm khi đóng đợt đồ án").policyValue("true").valueType("BOOLEAN").category("DATA_INTEGRITY").description("Ngăn chặn sửa điểm sau khi đợt đồ án chuyển trạng thái CLOSED.").build(),
                SecurityPolicy.builder().policyKey("AUDIT_RETENTION_DAYS").policyName("Thời gian lưu trữ Nhật ký hệ thống (ngày)").policyValue("365").valueType("INTEGER").category("AUDIT").description("Thời gian lưu trữ nhật ký kiểm toán.").build()
        );
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : encoded) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            return String.valueOf(rawToken.hashCode());
        }
    }

    public String parseDeviceInfo(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return "Unknown Device";
        }
        String ua = userAgent.toLowerCase();
        String browser = ua.contains("edg") ? "Edge"
                : ua.contains("chrome") ? "Chrome"
                : ua.contains("firefox") ? "Firefox"
                : ua.contains("safari") ? "Safari"
                : ua.contains("postman") ? "Postman"
                : "HTTP Client";

        String os = ua.contains("windows") ? "Windows"
                : ua.contains("mac") ? "macOS"
                : ua.contains("android") ? "Android"
                : (ua.contains("iphone") || ua.contains("ipad")) ? "iOS"
                : ua.contains("linux") ? "Linux"
                : "Unknown OS";

        return browser + " / " + os;
    }
}
