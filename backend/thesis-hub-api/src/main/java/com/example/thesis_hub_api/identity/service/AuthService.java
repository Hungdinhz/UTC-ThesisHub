package com.example.thesis_hub_api.identity.service;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.security.LoginRateLimiter;
import com.example.thesis_hub_api.identity.dto.request.AdminLoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.AdminRegisterRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.ChangePasswordRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.LoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.LoginResponseDTO;
import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.RoleRepository;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.identity.security.JwtTokenProvider;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import com.example.thesis_hub_api.projectround.repository.StudentProjectRoundRepository;
import com.example.thesis_hub_api.security.interceptor.AuditHttpInterceptor;
import com.example.thesis_hub_api.security.service.AuditLogService;
import com.example.thesis_hub_api.security.service.SecurityCenterService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final StudentProjectRoundRepository studentProjectRoundRepository;

    @Autowired(required = false)
    private LoginRateLimiter loginRateLimiter;

    @Autowired(required = false)
    private SecurityCenterService securityCenterService;

    @Autowired(required = false)
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private HttpServletRequest httpServletRequest;

    @Value("${app.admin.registration-key:}")
    private String adminRegistrationKey;

    @Value("${app.admin.require-key-on-login:false}")
    private boolean requireKeyOnLogin;

    private void checkRateLimit(String key) {
        if (loginRateLimiter != null) {
            loginRateLimiter.checkAllowed(key);
        }
    }

    private void recordLoginFailure(String key) {
        if (loginRateLimiter != null) {
            loginRateLimiter.recordFailure(key);
        }
    }

    private void resetRateLimit(String key) {
        if (loginRateLimiter != null) {
            loginRateLimiter.reset(key);
        }
    }

    private String resolveClientIp() {
        try {
            return AuditHttpInterceptor.extractClientIp(httpServletRequest);
        } catch (Exception e) {
            return "127.0.0.1";
        }
    }

    private String resolveUserAgent() {
        try {
            return httpServletRequest != null ? httpServletRequest.getHeader("User-Agent") : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        String identifier = request.getLoginIdentifier();
        if (!StringUtils.hasText(identifier) || !StringUtils.hasText(request.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        checkRateLimit(identifier);
        String ip = resolveClientIp();
        String userAgent = resolveUserAgent();

        // Try locating user by username or email
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(identifier, identifier);

        // Fallback: locate via student code
        if (userOpt.isEmpty()) {
            userOpt = studentRepository.findByStudentCode(identifier).map(Student::getUser);
        }

        // Fallback: locate via lecturer code
        if (userOpt.isEmpty()) {
            userOpt = lecturerRepository.findByLecturerCode(identifier).map(Lecturer::getUser);
        }

        if (userOpt.isEmpty()) {
            recordLoginFailure(identifier);
            if (auditLogService != null) {
                auditLogService.recordLog(
                        null, identifier, null, null,
                        "LOGIN_FAILED", "AUTH_SECURITY", "User", identifier,
                        "Đăng nhập thất bại với định danh không tồn tại: " + identifier,
                        null, null, "POST", "/api/v1/auth/login", ip, userAgent,
                        "WARNING", "FAILED", "Người dùng không tồn tại", null
                );
            }
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        User user = userOpt.get();

        // Check temporary brute-force lockout before validating credentials
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            if (auditLogService != null) {
                auditLogService.recordLog(
                        user.getId(), user.getUsername(), user.getFullName(),
                        user.getRole() != null ? user.getRole().getName() : null,
                        "LOGIN_FAILED", "AUTH_SECURITY", "User", String.valueOf(user.getId()),
                        "Từ chối đăng nhập do tài khoản " + user.getUsername() + " đang trong thời gian khóa bảo mật",
                        null, Map.of("lockedUntil", user.getLockedUntil().toString()),
                        "POST", "/api/v1/auth/login", ip, userAgent,
                        "HIGH", "BLOCKED", "Tài khoản đang bị tạm khóa bảo mật", null
                );
            }
            throw new AppException(ErrorCode.USER_LOCKED,
                    "Tài khoản đang bị tạm khóa bảo mật do nhập sai mật khẩu nhiều lần. Vui lòng thử lại sau ít phút hoặc liên hệ Quản trị viên.");
        }

        // Verify password BEFORE checking eligibility or lock status to prevent pre-auth user enumeration & academic info leak
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordLoginFailure(identifier);
            boolean lockedNow = securityCenterService != null
                    && securityCenterService.recordFailedPasswordAttempt(user.getId(), ip);
            if (lockedNow) {
                throw new AppException(ErrorCode.USER_LOCKED,
                        "Tài khoản đã bị tạm khóa bảo mật do nhập sai mật khẩu quá số lần quy định.");
            }
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        resetRateLimit(identifier);

        // Quy định UTC: Sinh viên ở trạng thái Không đủ điều kiện nhận đồ án (nợ học phí, kỷ luật, nợ tín >= 10, GPA < 2.0)
        // sẽ không được cấp tài khoản / không thể đăng nhập.
        if (user.getRole() != null && "ROLE_STUDENT".equalsIgnoreCase(user.getRole().getName())) {
            Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                if (studentProjectRoundRepository != null) {
                    List<StudentProjectRound> sprList = studentProjectRoundRepository.findByStudentId(student.getId());
                    if (!sprList.isEmpty()) {
                        // Kiểm tra xem sinh viên có bất kỳ đợt nào đang tham gia hợp lệ hay không
                        boolean hasValidParticipation = sprList.stream().anyMatch(spr -> {
                            String st = spr.getStatus();
                            if (st == null) return false;
                            return "ELIGIBLE".equalsIgnoreCase(st)
                                    || "FORCE_APPROVED".equalsIgnoreCase(st)
                                    || "REGISTERED".equalsIgnoreCase(st)
                                    || "ASSIGNED".equalsIgnoreCase(st)
                                    || "IN_PROGRESS".equalsIgnoreCase(st)
                                    || "DEFENSE_READY".equalsIgnoreCase(st)
                                    || "DEFENDED".equalsIgnoreCase(st)
                                    || "COMPLETED".equalsIgnoreCase(st)
                                    || "RESERVED".equalsIgnoreCase(st)
                                    || ("DROPPED".equalsIgnoreCase(st) && spr.getNote() != null && spr.getNote().toLowerCase().contains("chưa đăng ký"));
                        });

                        if (!hasValidParticipation) {
                            user.setIsActive(false);
                            userRepository.save(user);

                            // Lấy ghi chú lý do không đủ điều kiện từ đợt gần nhất
                            StudentProjectRound ineligibleSpr = sprList.stream()
                                    .filter(spr -> "INELIGIBLE".equalsIgnoreCase(spr.getStatus()) || "DISQUALIFIED".equalsIgnoreCase(spr.getStatus()))
                                    .reduce((first, second) -> second)
                                    .orElse(sprList.get(sprList.size() - 1));

                            String reason = StringUtils.hasText(ineligibleSpr.getNote())
                                    ? ineligibleSpr.getNote()
                                    : "Không đủ điều kiện học vụ";
                            throw new AppException(ErrorCode.USER_LOCKED,
                                    "Sinh viên ở trạng thái Không đủ điều kiện (" + reason + ") nên không được cấp tài khoản đăng nhập vào hệ thống.");
                        }
                    }
                }
            }
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_LOCKED, "Tài khoản của bạn đã bị khóa hoặc chưa được cấp phép.");
        }

        if (securityCenterService != null) {
            securityCenterService.resetFailedPasswordAttemptsOnSuccess(user.getId(), ip);
        }

        LoginResponseDTO response = buildLoginResponse(user);
        recordSuccessLoginSecurity(user, response.getToken(), ip, userAgent, "/api/v1/auth/login");
        return response;
    }

    @Transactional
    public LoginResponseDTO registerAdmin(AdminRegisterRequestDTO request) {
        // 1. Verify Admin Secret Key
        if (!StringUtils.hasText(request.getAdminSecretKey()) || !StringUtils.hasText(adminRegistrationKey)) {
            throw new AppException(ErrorCode.INVALID_ADMIN_SECRET_KEY);
        }
        boolean keyMatches = MessageDigest.isEqual(
                request.getAdminSecretKey().trim().getBytes(StandardCharsets.UTF_8),
                adminRegistrationKey.trim().getBytes(StandardCharsets.UTF_8)
        );
        if (!keyMatches) {
            throw new AppException(ErrorCode.INVALID_ADMIN_SECRET_KEY);
        }

        // 2. Validate passwords match
        if (StringUtils.hasText(request.getConfirmPassword())
                && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.CONFIRM_PASSWORD_MISMATCH);
        }

        // 3. Check duplicate username & email
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // 4. Find ROLE_ADMIN
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        // 5. Create User
        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null)
                .role(adminRole)
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("Registered new Admin account successfully: {} ({})", user.getUsername(), user.getEmail());

        LoginResponseDTO response = buildLoginResponse(user);
        recordSuccessLoginSecurity(user, response.getToken(), resolveClientIp(), resolveUserAgent(), "/api/v1/auth/admin/register");
        return response;
    }

    @Transactional
    public LoginResponseDTO adminLogin(AdminLoginRequestDTO request) {
        String identifier = request.getLoginIdentifier();
        if (!StringUtils.hasText(identifier) || !StringUtils.hasText(request.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        checkRateLimit("admin:" + identifier);
        String ip = resolveClientIp();
        String userAgent = resolveUserAgent();

        // 1. If requireKeyOnLogin is enabled, verify admin secret key
        if (requireKeyOnLogin) {
            if (!StringUtils.hasText(request.getAdminSecretKey())
                    || !StringUtils.hasText(adminRegistrationKey)
                    || !MessageDigest.isEqual(
                            request.getAdminSecretKey().trim().getBytes(StandardCharsets.UTF_8),
                            adminRegistrationKey.trim().getBytes(StandardCharsets.UTF_8))) {
                recordLoginFailure("admin:" + identifier);
                throw new AppException(ErrorCode.INVALID_ADMIN_SECRET_KEY);
            }
        }

        // 2. Find user by username or email
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(identifier, identifier);
        if (userOpt.isEmpty()) {
            recordLoginFailure("admin:" + identifier);
            if (auditLogService != null) {
                auditLogService.recordLog(
                        null, identifier, null, "ROLE_ADMIN",
                        "LOGIN_FAILED", "AUTH_SECURITY", "User", identifier,
                        "Đăng nhập Admin thất bại với tài khoản không tồn tại: " + identifier,
                        null, null, "POST", "/api/v1/auth/admin/login", ip, userAgent,
                        "HIGH", "FAILED", "Tài khoản không tồn tại", null
                );
            }
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        User user = userOpt.get();

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new AppException(ErrorCode.USER_LOCKED,
                    "Tài khoản Quản trị viên đang bị tạm khóa bảo mật do nhập sai mật khẩu nhiều lần.");
        }

        // 3. Verify password first before revealing role or lock status
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordLoginFailure("admin:" + identifier);
            boolean lockedNow = securityCenterService != null
                    && securityCenterService.recordFailedPasswordAttempt(user.getId(), ip);
            if (lockedNow) {
                throw new AppException(ErrorCode.USER_LOCKED,
                        "Tài khoản Quản trị viên đã bị tạm khóa bảo mật do nhập sai mật khẩu quá số lần quy định.");
            }
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        // 4. Verify role must be ROLE_ADMIN
        if (user.getRole() == null || !"ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            recordLoginFailure("admin:" + identifier);
            if (auditLogService != null) {
                auditLogService.recordLog(
                        user.getId(), user.getUsername(), user.getFullName(),
                        user.getRole() != null ? user.getRole().getName() : null,
                        "LOGIN_FAILED", "AUTH_SECURITY", "User", String.valueOf(user.getId()),
                        "Tài khoản không có quyền Admin cố gắng đăng nhập cổng Quản trị",
                        null, null, "POST", "/api/v1/auth/admin/login", ip, userAgent,
                        "HIGH", "BLOCKED", "Không có quyền Quản trị viên", null
                );
            }
            throw new AppException(ErrorCode.NOT_AN_ADMIN_ACCOUNT);
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_LOCKED);
        }

        resetRateLimit("admin:" + identifier);
        if (securityCenterService != null) {
            securityCenterService.resetFailedPasswordAttemptsOnSuccess(user.getId(), ip);
        }

        // 5. Generate token
        LoginResponseDTO response = buildLoginResponse(user);
        recordSuccessLoginSecurity(user, response.getToken(), ip, userAgent, "/api/v1/auth/admin/login");
        return response;
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequestDTO request) {
        String oldPassword = request.getActualOldPassword();
        String newPassword = request.getActualNewPassword();
        String confirmPassword = request.getActualConfirmPassword();

        if (!StringUtils.hasText(oldPassword) || !StringUtils.hasText(newPassword)) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        if (newPassword.length() < 6) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        if (StringUtils.hasText(confirmPassword) && !newPassword.equals(confirmPassword)) {
            throw new AppException(ErrorCode.CONFIRM_PASSWORD_MISMATCH);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);
        log.info("Password changed successfully for user ID: {}", userId);
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO refreshToken(String bearerToken) {
        String token = bearerToken;
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            token = bearerToken.substring(7);
        }

        if (!StringUtils.hasText(token) || !jwtTokenProvider.validateToken(token)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (securityCenterService != null && securityCenterService.isTokenRevoked(token)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Phiên đăng nhập đã bị thu hồi");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        User user;
        if (userId != null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        } else {
            String username = jwtTokenProvider.getUsernameFromToken(token);
            user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_LOCKED);
        }

        return buildLoginResponse(user);
    }

    private void recordSuccessLoginSecurity(User user, String accessToken, String ip, String userAgent, String uri) {
        if (securityCenterService != null) {
            securityCenterService.registerLoginSession(user, accessToken, jwtTokenProvider.getExpirationMs(), ip, userAgent);
        }
        if (auditLogService != null) {
            auditLogService.recordLog(
                    user.getId(),
                    user.getUsername(),
                    user.getFullName(),
                    user.getRole() != null ? user.getRole().getName() : "ROLE_STUDENT",
                    "LOGIN_SUCCESS",
                    "AUTH_SECURITY",
                    "User",
                    String.valueOf(user.getId()),
                    "Đăng nhập hệ thống thành công: " + user.getUsername(),
                    null,
                    Map.of("username", user.getUsername(), "role", user.getRole() != null ? user.getRole().getName() : "ROLE_STUDENT"),
                    "POST",
                    uri,
                    ip,
                    userAgent,
                    "INFO",
                    "SUCCESS",
                    null,
                    null
            );
        }
    }

    private LoginResponseDTO buildLoginResponse(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = jwtTokenProvider.generateTokenFromUser(principal);
        String refreshToken = jwtTokenProvider.generateRefreshTokenFromUser(principal);
        if (!StringUtils.hasText(refreshToken)) {
            refreshToken = accessToken;
        }
        Instant expiresAt = Instant.now().plus(jwtTokenProvider.getExpirationMs(), ChronoUnit.MILLIS);
        String expireTimeStr = expiresAt.toString();

        return LoginResponseDTO.builder()
                .token(accessToken)
                .access(accessToken)
                .refreshToken(refreshToken)
                .refresh(refreshToken)
                .type("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().getName() : "ROLE_STUDENT")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .expireTime(expireTimeStr)
                .expireTimeSnake(expireTimeStr)
                .build();
    }
}
