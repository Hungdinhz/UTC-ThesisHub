package com.example.thesis_hub_api.assignment.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "lecturer_directions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"lecturer_id", "project_direction_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LecturerDirection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "lecturer_id", nullable = false)
    private Integer lecturerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_direction_id", nullable = false)
    private ProjectDirection projectDirection;
}
