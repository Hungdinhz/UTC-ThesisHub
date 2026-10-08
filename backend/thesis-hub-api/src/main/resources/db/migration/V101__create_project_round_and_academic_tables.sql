-- =============================================================================
-- Migration: V101__create_project_round_and_academic_tables.sql
-- Module: Module 1 (Project Round & Academic Records) - Owner: Phung Dinh Hung
-- Tables: project_rounds, timeline_milestones, student_project_rounds, academic_records
-- Description: Core tables for managing graduation project rounds, phases, and academic inputs.
-- =============================================================================

-- 10. PROJECT_ROUNDS (Đợt đồ án / khóa luận tốt nghiệp)
CREATE TABLE IF NOT EXISTS project_rounds (
    id                  BIGSERIAL PRIMARY KEY,
    round_code          VARCHAR(100) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    academic_year       VARCHAR(50) NOT NULL,
    semester            VARCHAR(20) NOT NULL,
    training_program_id BIGINT REFERENCES training_programs(id) ON DELETE SET NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    start_date          DATE,
    end_date            DATE,
    description         TEXT,
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_project_rounds_status 
        CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_project_rounds_round_code ON project_rounds(round_code);
CREATE INDEX IF NOT EXISTS idx_project_rounds_status ON project_rounds(status);
CREATE INDEX IF NOT EXISTS idx_project_rounds_training_program_id ON project_rounds(training_program_id);

-- 11. TIMELINE_MILESTONES (Các mốc thời gian / giai đoạn của đợt đồ án)
CREATE TABLE IF NOT EXISTS timeline_milestones (
    id               BIGSERIAL PRIMARY KEY,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    phase_type       VARCHAR(100) NOT NULL,
    start_date       TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date         TIMESTAMP WITH TIME ZONE NOT NULL,
    description      TEXT,
    order_index      INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_timeline_milestones_dates 
        CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_timeline_milestones_round_id ON timeline_milestones(project_round_id);
CREATE INDEX IF NOT EXISTS idx_timeline_milestones_phase_type ON timeline_milestones(phase_type);

-- 12. STUDENT_PROJECT_ROUNDS (Sinh viên tham gia đợt đồ án)
CREATE TABLE IF NOT EXISTS student_project_rounds (
    id               BIGSERIAL PRIMARY KEY,
    student_id       BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    status           VARCHAR(50) NOT NULL DEFAULT 'ELIGIBLE',
    note             TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_project_round UNIQUE (student_id, project_round_id),
    CONSTRAINT chk_student_project_rounds_status 
        CHECK (status IN ('ELIGIBLE', 'REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'DROPPED', 'DEFENDED', 'RESERVED'))
);

CREATE INDEX IF NOT EXISTS idx_student_project_rounds_student_id ON student_project_rounds(student_id);
CREATE INDEX IF NOT EXISTS idx_student_project_rounds_round_id ON student_project_rounds(project_round_id);
CREATE INDEX IF NOT EXISTS idx_student_project_rounds_status ON student_project_rounds(status);

-- 13. ACADEMIC_RECORDS (Kết quả học vụ phục vụ xét điều kiện)
CREATE TABLE IF NOT EXISTS academic_records (
    id                          BIGSERIAL PRIMARY KEY,
    student_id                  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_round_id            BIGINT REFERENCES project_rounds(id) ON DELETE CASCADE,
    completed_credits           INT NOT NULL DEFAULT 0,
    gpa                         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tuition_debt                BOOLEAN NOT NULL DEFAULT FALSE,
    under_disciplinary_action   BOOLEAN NOT NULL DEFAULT FALSE,
    missing_prerequisite_count  INT NOT NULL DEFAULT 0,
    note                        TEXT,
    imported_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_academic_record UNIQUE (student_id, project_round_id)
);

CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_round_id ON academic_records(project_round_id);
