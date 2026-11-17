package com.example.thesis_hub_api.security.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Configurable system-wide security & data integrity policies.
 */
@Entity
@Table(name = "security_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_key", nullable = false, unique = true, length = 100)
    private String policyKey;

    @Column(name = "policy_name", nullable = false, length = 255)
    private String policyName;

    @Column(name = "policy_value", nullable = false, length = 255)
    private String policyValue;

    @Column(name = "value_type", nullable = false, length = 30)
    @Builder.Default
    private String valueType = "STRING";

    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "AUTHENTICATION";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        this.updatedAt = Instant.now();
    }
}
