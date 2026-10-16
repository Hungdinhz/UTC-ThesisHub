-- =============================================================================
-- Migration: V203__create_assignment_direction_registrations.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Table: direction_registrations (DANGKYHUONG)
-- Description: Student project direction registration per project round.
-- =============================================================================

CREATE TABLE IF NOT EXISTS direction_registrations (
    id               BIGSERIAL PRIMARY KEY,
    student_id       BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    direction_id     BIGINT NOT NULL REFERENCES project_directions(id) ON DELETE CASCADE,
    status           VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    registered_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note             TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_round_direction UNIQUE (student_id, project_round_id),
    CONSTRAINT chk_direction_reg_status CHECK (status IN ('REGISTERED', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_direction_registrations_student_id ON direction_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_direction_registrations_round_id ON direction_registrations(project_round_id);
CREATE INDEX IF NOT EXISTS idx_direction_registrations_direction_id ON direction_registrations(direction_id);
CREATE INDEX IF NOT EXISTS idx_direction_registrations_status ON direction_registrations(status);
