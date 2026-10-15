package com.example.thesis_hub_api.organization.entity;

import com.example.thesis_hub_api.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "lecturers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lecturer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "lecturer_code", nullable = false, unique = true, length = 50)
    private String lecturerCode;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "academic_degree", nullable = false, length = 50)
    private String academicDegree; // THAC_SI, TIEN_SI, PGS, GS, OTHER

    @Column(name = "research_interests", columnDefinition = "TEXT")
    private String researchInterests;

    @Column(name = "max_thesis_quota", nullable = false)
    @Builder.Default
    private Integer maxThesisQuota = 5;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
