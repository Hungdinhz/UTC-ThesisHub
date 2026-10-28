package com.example.thesis_hub_api.defense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "defense_minutes_signatures",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_defense_minutes_sig_thesis_lecturer", columnNames = {"thesis_id", "lecturer_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseMinutesSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thesis_id", nullable = false)
    private Long thesisId;

    @Column(name = "council_id", nullable = false)
    private Long councilId;

    @Column(name = "lecturer_id", nullable = false)
    private Long lecturerId;

    @Column(name = "member_role", nullable = false, length = 50)
    private String memberRole;

    @Column(name = "signed_at", nullable = false)
    private Instant signedAt;

    @PrePersist
    public void prePersist() {
        if (this.signedAt == null) {
            this.signedAt = Instant.now();
        }
    }
}
