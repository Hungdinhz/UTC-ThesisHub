package com.example.thesis_hub_api.security;

import com.example.thesis_hub_api.identity.entity.Role;
import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.identity.repository.UserRepository;
import com.example.thesis_hub_api.security.dto.*;
import com.example.thesis_hub_api.security.entity.AuditLog;
import com.example.thesis_hub_api.security.entity.SecurityPolicy;
import com.example.thesis_hub_api.security.entity.SecuritySession;
import com.example.thesis_hub_api.security.repository.AuditLogRepository;
import com.example.thesis_hub_api.security.repository.SecurityPolicyRepository;
import com.example.thesis_hub_api.security.repository.SecuritySessionRepository;
import com.example.thesis_hub_api.security.service.AuditLogService;
import com.example.thesis_hub_api.security.service.SecurityCenterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAndAuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SecuritySessionRepository sessionRepository;

    @Mock
    private SecurityPolicyRepository policyRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private SecurityCenterService securityCenterService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        securityCenterService = new SecurityCenterService(
                sessionRepository,
                policyRepository,
                auditLogRepository,
                userRepository,
                auditLogService
        );

        Role studentRole = Role.builder().id(1L).name("ROLE_STUDENT").displayName("Sinh viên").build();
        sampleUser = User.builder()
                .id(50L)
                .username("201200101")
                .email("201200101@st.utc.edu.vn")
                .fullName("Nguyễn Văn A")
                .role(studentRole)
                .isActive(true)
                .failedLoginAttempts(0)
                .build();
    }

    @Test
    void testRecordLog_SerializesOldAndNewValuesToJson() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> {
            AuditLog log = inv.getArgument(0);
            log.setId(100L);
            log.setCreatedAt(Instant.now());
            return log;
        });

        AuditLogResponseDTO result = auditLogService.recordLog(
                1L, "admin", "Quản trị viên", "ROLE_ADMIN",
                "POLICY_UPDATED", "AUTH_SECURITY", "SecurityPolicy", "MAX_FAILED_LOGIN_ATTEMPTS",
                "Cập nhật chính sách",
                Map.of("policyValue", "5"),
                Map.of("policyValue", "3"),
                "PUT", "/api/v1/admin/security/policies/MAX_FAILED_LOGIN_ATTEMPTS",
                "192.168.1.10", "Chrome", "HIGH", "SUCCESS", null, 18L
        );

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("HIGH", result.getSeverity());
        assertTrue(result.getOldValues().contains("\"5\""));
        assertTrue(result.getNewValues().contains("\"3\""));
    }

    @Test
    void testGetAuditStats_AndExportCsv() {
        when(auditLogRepository.count()).thenReturn(12L);
        when(auditLogRepository.countByCreatedAtAfter(any())).thenReturn(4L);
        when(auditLogRepository.countBySeverityIn(any())).thenReturn(3L);
        when(auditLogRepository.countByStatusIn(any())).thenReturn(1L);
        when(auditLogRepository.countGroupedByModule()).thenReturn(List.of(
                new Object[]{"AUTH_SECURITY", 7L},
                new Object[]{"DEFENSE_SCORING", 5L}
        ));

        AuditLogStatsDTO stats = auditLogService.getAuditStats();
        assertEquals(12L, stats.getTotalLogs());
        assertEquals(4L, stats.getTodayLogs());
        assertEquals(3L, stats.getHighSeverityLogs());
        assertEquals(1L, stats.getFailedOrBlockedLogs());
        assertEquals(7L, stats.getModuleBreakdown().get("AUTH_SECURITY"));

        AuditLog row = AuditLog.builder()
                .id(1L)
                .actorUsername("admin")
                .actorFullName("Admin UTC")
                .actorRole("ROLE_ADMIN")
                .moduleName("AUTH_SECURITY")
                .actionType("LOGIN_SUCCESS")
                .severity("INFO")
                .status("SUCCESS")
                .summary("Đăng nhập thành công")
                .ipAddress("127.0.0.1")
                .createdAt(Instant.now())
                .build();

        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(row)));

        byte[] csvBytes = auditLogService.exportLogsToCsv(new AuditLogFilterDTO());
        String csvText = new String(csvBytes, StandardCharsets.UTF_8);
        assertTrue(csvText.startsWith("\uFEFF"));
        assertTrue(csvText.contains("LOGIN_SUCCESS"));
        assertTrue(csvText.contains("admin"));
    }

    @Test
    void testRegisterRevokeAndCheckSession() {
        String rawToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample.payload";
        when(sessionRepository.save(any(SecuritySession.class))).thenAnswer(inv -> {
            SecuritySession s = inv.getArgument(0);
            s.setId(22L);
            return s;
        });

        securityCenterService.registerLoginSession(sampleUser, rawToken, 3600000L, "10.0.0.5", "Mozilla/5.0 Chrome Windows");

        ArgumentCaptor<SecuritySession> captor = ArgumentCaptor.forClass(SecuritySession.class);
        verify(sessionRepository).save(captor.capture());
        SecuritySession savedSession = captor.getValue();
        assertEquals("ACTIVE", savedSession.getStatus());
        assertEquals("Chrome / Windows", savedSession.getDeviceInfo());

        when(sessionRepository.findById(22L)).thenReturn(Optional.of(savedSession));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        SecuritySessionDTO revoked = securityCenterService.revokeSession(22L, 1L, "admin", "Phát hiện truy cập lạ", "127.0.0.1");
        assertEquals("REVOKED", revoked.getStatus());

        when(sessionRepository.findBySessionTokenId(savedSession.getSessionTokenId())).thenReturn(Optional.of(savedSession));
        assertTrue(securityCenterService.isTokenRevoked(rawToken));
    }

    @Test
    void testBruteForceLockoutAndAdminUnlock() {
        sampleUser.setFailedLoginAttempts(4);
        when(userRepository.findById(50L)).thenReturn(Optional.of(sampleUser));
        when(policyRepository.findByPolicyKey("MAX_FAILED_LOGIN_ATTEMPTS"))
                .thenReturn(Optional.of(SecurityPolicy.builder().policyKey("MAX_FAILED_LOGIN_ATTEMPTS").policyValue("5").build()));
        when(policyRepository.findByPolicyKey("ACCOUNT_LOCKOUT_MINUTES"))
                .thenReturn(Optional.of(SecurityPolicy.builder().policyKey("ACCOUNT_LOCKOUT_MINUTES").policyValue("15").build()));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        boolean lockedNow = securityCenterService.recordFailedPasswordAttempt(50L, "14.1.2.3");

        assertTrue(lockedNow);
        assertEquals(5, sampleUser.getFailedLoginAttempts());
        assertNotNull(sampleUser.getLockedUntil());
        assertTrue(sampleUser.getLockedUntil().isAfter(Instant.now()));

        LockedAccountDTO unlocked = securityCenterService.unlockAccount(50L, 1L, "admin", "127.0.0.1");
        assertEquals("UNLOCKED", unlocked.getLockState());
        assertEquals(0, unlocked.getFailedLoginAttempts());
        assertNull(unlocked.getLockedUntil());
    }

    @Test
    void testUpdatePolicy_AndRbacMatrix() {
        SecurityPolicy existing = SecurityPolicy.builder()
                .id(1L)
                .policyKey("MAX_FAILED_LOGIN_ATTEMPTS")
                .policyName("Giới hạn đăng nhập sai tối đa")
                .policyValue("5")
                .valueType("INTEGER")
                .category("AUTHENTICATION")
                .build();

        when(policyRepository.findByPolicyKey("MAX_FAILED_LOGIN_ATTEMPTS")).thenReturn(Optional.of(existing));
        when(policyRepository.save(any(SecurityPolicy.class))).thenAnswer(i -> i.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        SecurityPolicyDTO updated = securityCenterService.updatePolicy("MAX_FAILED_LOGIN_ATTEMPTS", "3", 1L, "admin", "127.0.0.1");
        assertEquals("3", updated.getPolicyValue());

        List<RbacPermissionItemDTO> rbac = securityCenterService.getRbacMatrix();
        assertFalse(rbac.isEmpty());
        assertTrue(rbac.stream().anyMatch(r -> r.getModule().contains("Hệ thống & Bảo mật") && Boolean.TRUE.equals(r.getRoleAccess().get("ROLE_ADMIN"))));
    }
}
