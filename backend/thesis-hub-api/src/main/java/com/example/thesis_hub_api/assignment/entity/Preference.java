package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "preferences", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"direction_registration_id", "lecturer_id"}),
        @UniqueConstraint(columnNames = {"direction_registration_id", "priority_order"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direction_registration_id", nullable = false)
    private DirectionRegistration directionRegistration;

    @Column(name = "lecturer_id", nullable = false)
    private Integer lecturerId;

    @Column(name = "priority_order", nullable = false)
    private Integer priorityOrder;

    @Column(name = "extra_criteria", columnDefinition = "TEXT")
    private String extraCriteria;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
