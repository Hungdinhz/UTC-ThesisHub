package com.example.thesis_hub_api.progress.entity;

import com.example.thesis_hub_api.identity.entity.User;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an individual assignment or task in thesis execution (CONGVIEC).
 * Module: Progress / Execution (Owner: Ngo Minh Quyet)
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false)
    private Thesis thesis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", nullable = false)
    private User assignedTo;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Priority: LOW, MEDIUM, HIGH, URGENT
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "MEDIUM";

    /**
     * Status: TODO, IN_PROGRESS, SUBMITTED, REVISE, COMPLETED, CANCELLED
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "TODO";

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Submission> submissions = new ArrayList<>();

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
