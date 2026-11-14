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
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private LoginRateLimiter loginRateLimiter;

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

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        String identifier = request.getLoginIdentifier();
        if (!StringUtils.hasText(identifier) || !StringUtils.hasText(request.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        checkRateLimit(identifier);

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
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        User user = userOpt.get();

        // Verify password BEFORE checking eligibility or lock status to prevent pre-auth user enumeration & academic info leak
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordLoginFailure(identifier);
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

                            String reason = org.springframework.util.StringUtils.hasText(ineligibleSpr.getNote())
                                    ? ineligibleSpr.getNote()
                                    : "Không đủ điều kiện học vụ";
                            throw new AppException(ErrorCode.USER_LOCKED,
                                    "Sinh viên ở trạng thái Không đủ điều kiện (" + reason + ") nên không được cấp tài khoản đăng nhập vào hệ thống.");
                        } else {
                            // Nếu sinh viên có đợt tham gia hợp lệ nhưng tài khoản đang bị vô hiệu hóa, tự động kích hoạt lại
                            if (!Boolean.TRUE.equals(user.getIsActive())) {
                                user.setIsActive(true);
                                userRepository.save(user);
                            }
                        }
                    }
                }
            }
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_LOCKED, "Tài khoản của bạn đã bị khóa hoặc chưa được cấp phép.");
        }

        return buildLoginResponse(user);
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

        // 6. Return LoginResponseDTO
        return buildLoginResponse(user);
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO adminLogin(AdminLoginRequestDTO request) {
        String identifier = request.getLoginIdentifier();
        if (!StringUtils.hasText(identifier) || !StringUtils.hasText(request.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_FAILED);
        }

        checkRateLimit("admin:" + identifier);

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
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        User user = userOpt.get();

        // 3. Verify password first before revealing role or lock status
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordLoginFailure("admin:" + identifier);
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        // 4. Verify role must be ROLE_ADMIN
        if (user.getRole() == null || !"ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            recordLoginFailure("admin:" + identifier);
            throw new AppException(ErrorCode.NOT_AN_ADMIN_ACCOUNT);
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_LOCKED);
        }

        resetRateLimit("admin:" + identifier);

        // 5. Generate token
        return buildLoginResponse(user);
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
