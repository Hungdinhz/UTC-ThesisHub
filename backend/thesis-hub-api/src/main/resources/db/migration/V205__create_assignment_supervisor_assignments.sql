-- =============================================================================
-- Migration: V205__create_assignment_supervisor_assignments.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Table: supervisor_assignments (PHANCONGHUONGDAN)
-- Description: Proposed, overridden, and finalized supervisor assignments.
-- =============================================================================

CREATE TABLE IF NOT EXISTS supervisor_assignments (
    id                   BIGSERIAL PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lecturer_id          BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    project_round_id     BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    direction_id         BIGINT REFERENCES project_directions(id) ON DELETE SET NULL,
    matched_priority     INT,
    match_score          DOUBLE PRECISION,
    assignment_method    VARCHAR(50) NOT NULL DEFAULT 'ALGORITHM',
    status               VARCHAR(30) NOT NULL DEFAULT 'PROPOSED',
    is_overridden        BOOLEAN NOT NULL DEFAULT FALSE,
    previous_lecturer_id BIGINT REFERENCES lecturers(id) ON DELETE SET NULL,
    override_reason      TEXT,
    overridden_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    overridden_at        TIMESTAMP WITH TIME ZONE,
    finalized_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    finalized_at         TIMESTAMP WITH TIME ZONE,
    note                 TEXT,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_round_assignment UNIQUE (student_id, project_round_id),
    CONSTRAINT chk_assignment_method CHECK (assignment_method IN ('ALGORITHM', 'MANUAL_OVERRIDE', 'DIRECT_ASSIGNMENT')),
    CONSTRAINT chk_assignment_status CHECK (status IN ('PROPOSED', 'OVERRIDDEN', 'FINALIZED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_student_id ON supervisor_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_lecturer_id ON supervisor_assignments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_round_id ON supervisor_assignments(project_round_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_direction_id ON supervisor_assignments(direction_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_status ON supervisor_assignments(status);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_is_overridden ON supervisor_assignments(is_overridden);
