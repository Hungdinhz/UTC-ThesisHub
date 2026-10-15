-- =============================================================================
-- Migration: V309__create_comments.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: comments (BINHLUAN - Comment)
-- Description: Comments/Discussions on tasks or submissions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS comments (
    id                  BIGSERIAL PRIMARY KEY,
    task_id             BIGINT,
    submission_id       BIGINT,
    author_id           BIGINT NOT NULL,
    content             TEXT NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_comments_task_id
    ON comments(task_id);

CREATE INDEX IF NOT EXISTS idx_comments_submission_id
    ON comments(submission_id);
