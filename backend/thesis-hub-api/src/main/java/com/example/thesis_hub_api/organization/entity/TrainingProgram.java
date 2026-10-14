package com.example.thesis_hub_api.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "training_programs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // CU_NHAN, KY_SU

    @Column(nullable = false, length = 100)
    private String name; // Chương trình Cử nhân, Chương trình Kỹ sư

    @Column(name = "duration_years", nullable = false, precision = 3, scale = 1)
    private BigDecimal durationYears; // 4.0, 4.5

    @Column(name = "total_credits")
    private Integer totalCredits; // 130, 150

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
