-- =============================================================================
-- Migration: V204__create_assignment_preferences.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Table: preferences (NGUYENVONG)
-- Description: Student supervisor preferences (NV1, NV2, NV3) and prioritization criteria.
-- =============================================================================

CREATE TABLE IF NOT EXISTS preferences (
    id                      BIGSERIAL PRIMARY KEY,
    student_id              BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_round_id        BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    lecturer_id             BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    priority                INT NOT NULL,
    gpa                     DOUBLE PRECISION,
    prioritization_criteria TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_round_priority UNIQUE (student_id, project_round_id, priority),
    CONSTRAINT uq_student_round_lecturer UNIQUE (student_id, project_round_id, lecturer_id),
    CONSTRAINT chk_preference_priority CHECK (priority IN (1, 2, 3)),
    CONSTRAINT chk_preference_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_preferences_student_id ON preferences(student_id);
CREATE INDEX IF NOT EXISTS idx_preferences_round_id ON preferences(project_round_id);
CREATE INDEX IF NOT EXISTS idx_preferences_lecturer_id ON preferences(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_preferences_priority ON preferences(priority);
CREATE INDEX IF NOT EXISTS idx_preferences_status ON preferences(status);
