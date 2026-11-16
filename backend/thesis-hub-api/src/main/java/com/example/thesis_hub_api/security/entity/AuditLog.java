package com.example.thesis_hub_api.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Immutable (append-only) enterprise audit log entry.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "actor_full_name", length = 255)
    private String actorFullName;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;

    @Column(name = "module_name", nullable = false, length = 60)
    private String moduleName;

    @Column(name = "target_entity", length = 100)
    private String targetEntity;

    @Column(name = "target_id", length = 100)
    private String targetId;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "old_values", columnDefinition = "TEXT")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "TEXT")
    private String newValues;

    @Column(name = "request_method", length = 16)
    private String requestMethod;

    @Column(name = "request_uri", length = 500)
    private String requestUri;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private String severity = "INFO";

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.severity == null) {
            this.severity = "INFO";
        }
        if (this.status == null) {
            this.status = "SUCCESS";
        }
    }
}
