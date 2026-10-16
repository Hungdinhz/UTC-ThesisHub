package com.example.thesis_hub_api.progress;

import com.example.thesis_hub_api.progress.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Progress Module Entities Unit Tests - Module 3 (Owner: Ngo Minh Quyet)")
class ProgressEntitiesTest {

    @Test
    @DisplayName("Should create Task with priority and lifecycle")
    void testTaskEntity() {
        Task task = Task.builder()
                .title("Cài đặt PostgreSQL và Flyway")
                .description("Cấu hình datasource trong application.yml")
                .priority("HIGH")
                .status("TODO")
                .build();

        assertEquals("Cài đặt PostgreSQL và Flyway", task.getTitle());
        assertEquals("HIGH", task.getPriority());
        assertEquals("TODO", task.getStatus());

        task.setStatus("COMPLETED");
        task.setCompletedAt(Instant.now());

        assertEquals("COMPLETED", task.getStatus());
        assertNotNull(task.getCompletedAt());
    }

    @Test
    @DisplayName("Should create Submission for a task")
    void testSubmissionEntity() {
        Submission sub = Submission.builder()
                .title("Kết quả bài nộp đợt 1")
                .submissionContent("Đã hoàn thành file script SQL và test pass")
                .fileUrl("/uploads/submissions/test.sql")
                .status("SUBMITTED")
                .build();

        assertEquals("Kết quả bài nộp đợt 1", sub.getTitle());
        assertEquals("SUBMITTED", sub.getStatus());

        sub.setStatus("ACCEPTED");
        sub.setReviewFeedback("Làm rất tốt");

        assertEquals("ACCEPTED", sub.getStatus());
        assertEquals("Làm rất tốt", sub.getReviewFeedback());
    }

    @Test
    @DisplayName("Should create Comment thread")
    void testCommentEntity() {
        Comment comment = Comment.builder()
                .content("Thầy xem giúp em phần cấu hình quan hệ bảng với ạ")
                .isEdited(false)
                .build();

        assertEquals("Thầy xem giúp em phần cấu hình quan hệ bảng với ạ", comment.getContent());
        assertFalse(comment.getIsEdited());
    }

    @Test
    @DisplayName("Should create ProgressReport and ProgressFeedback")
    void testProgressReportAndFeedback() {
        ProgressReport report = ProgressReport.builder()
                .reportTitle("Báo cáo tuần 3")
                .completedWork("Hoàn thành frontend Kanban")
                .plannedWork("Tích hợp API thực tế")
                .progressPercent(60)
                .status("SUBMITTED")
                .build();

        assertEquals("Báo cáo tuần 3", report.getReportTitle());
        assertEquals(60, report.getProgressPercent());

        ProgressFeedback feedback = ProgressFeedback.builder()
                .progressReport(report)
                .feedbackContent("Tiến độ đạt yêu cầu, cố gắng hoàn thành sớm")
                .assessment("DAT")
                .confirmedCompletionRate(BigDecimal.valueOf(60.00))
                .build();

        report.setFeedback(feedback);
        report.setStatus("REVIEWED");

        assertEquals("REVIEWED", report.getStatus());
        assertEquals("DAT", report.getFeedback().getAssessment());
        assertEquals(BigDecimal.valueOf(60.00), report.getFeedback().getConfirmedCompletionRate());
    }
}
