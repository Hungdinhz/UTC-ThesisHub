-- =============================================================================
-- Migration: V307__create_tasks.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: tasks (CONGVIEC - Task)
-- Description: Tasks assigned by lecturers to students during thesis execution.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    assignee_id         BIGINT NOT NULL, -- The student
    assigner_id         BIGINT NOT NULL, -- The lecturer
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    due_date            TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(30) NOT NULL DEFAULT 'TODO',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status constraint
    CONSTRAINT chk_tasks_status
        CHECK (status IN ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED', 'COMPLETED'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_tasks_thesis_id
    ON tasks(thesis_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id
    ON tasks(assignee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks(status);
