-- =============================================================================
-- Migration: V405__create_defense_schedules.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: defense_schedules (LICHBAOVE - DefenseSchedule)
-- Description: Schedule sessions (room, date, session) for defense councils.
-- =============================================================================

CREATE TABLE IF NOT EXISTS defense_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    council_id          BIGINT NOT NULL,
    defense_date        DATE NOT NULL,
    session             VARCHAR(20) NOT NULL,
    room                VARCHAR(50),
    start_time          TIME,
    end_time            TIME,
    max_students        INT NOT NULL DEFAULT 12,
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_defense_schedules_session 
        CHECK (session IN ('MORNING', 'AFTERNOON')),

    CONSTRAINT chk_defense_schedules_status 
        CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),

    CONSTRAINT uk_defense_schedules_council_date_session 
        UNIQUE (council_id, defense_date, session),

    -- Foreign keys referencing defense_councils
    CONSTRAINT fk_defense_schedules_council 
        FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_defense_schedules_council_id 
    ON defense_schedules(council_id);

CREATE INDEX IF NOT EXISTS idx_defense_schedules_date 
    ON defense_schedules(defense_date);

CREATE INDEX IF NOT EXISTS idx_defense_schedules_session 
    ON defense_schedules(session);

CREATE INDEX IF NOT EXISTS idx_defense_schedules_room 
    ON defense_schedules(room);

CREATE INDEX IF NOT EXISTS idx_defense_schedules_status 
    ON defense_schedules(status);
