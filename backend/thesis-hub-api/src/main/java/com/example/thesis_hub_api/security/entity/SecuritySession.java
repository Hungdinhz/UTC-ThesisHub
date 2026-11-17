package com.example.thesis_hub_api.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Tracks active and revoked JWT authentication sessions across devices.
 */
@Entity
@Table(name = "security_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecuritySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_token_id", nullable = false, unique = true, length = 128)
    private String sessionTokenId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "role_name", length = 50)
    private String roleName;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt;

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by")
    private Long revokedBy;

    @Column(name = "revoke_reason", length = 255)
    private String revokeReason;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.issuedAt == null) {
            this.issuedAt = now;
        }
        if (this.lastActivityAt == null) {
            this.lastActivityAt = now;
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }
}
