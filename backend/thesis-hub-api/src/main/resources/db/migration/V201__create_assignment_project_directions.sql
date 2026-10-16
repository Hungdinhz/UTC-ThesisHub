-- =============================================================================
-- Migration: V201__create_assignment_project_directions.sql
-- Module: Module 2 (Assignment / Supervisor Allocation) - Owner: Nguyen Dinh Cong
-- Tables: project_directions (HUONGDOAN), lecturer_directions (GIANGVIEN_HUONGDOAN)
-- Description: Master data for thesis directions and lecturer expertise mapping.
-- =============================================================================

-- 1. HUONGDOAN (Project Direction / Specialization track)
CREATE TABLE IF NOT EXISTS project_directions (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_directions_code ON project_directions(code);
CREATE INDEX IF NOT EXISTS idx_project_directions_department_id ON project_directions(department_id);
CREATE INDEX IF NOT EXISTS idx_project_directions_is_active ON project_directions(is_active);

-- 2. GIANGVIEN_HUONGDOAN (Lecturer - Project Direction mapping)
CREATE TABLE IF NOT EXISTS lecturer_directions (
    id            BIGSERIAL PRIMARY KEY,
    lecturer_id   BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    direction_id  BIGINT NOT NULL REFERENCES project_directions(id) ON DELETE CASCADE,
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    note          TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_lecturer_direction UNIQUE (lecturer_id, direction_id)
);

CREATE INDEX IF NOT EXISTS idx_lecturer_directions_lecturer_id ON lecturer_directions(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_directions_direction_id ON lecturer_directions(direction_id);
