-- =============================================================================
-- Migration: V419__update_workflow_signatures_files_and_group_chat.sql
-- Description:
--   1. stored_files: Cross-machine persistent binary file storage in PostgreSQL (#5)
--   2. project_rounds.supplementary_open: Track supplementary registration lock (#3, #4)
--   3. proposals.student_signed & student_signed_at: Persistent student signature (#9)
--   4. submissions schema/constraint cleanup: Unlimited task revisions (#10)
--   5. defense_schedule_theses: Manual schedule-to-student/thesis assignment (#16)
--   6. defense_minutes_signatures: 5 council members digital signing (#22, #23)
--   7. chat_messages: Supervisor - Student group chat rooms (#28)
-- =============================================================================

-- 1. Persistent file storage table for cross-machine & cloud container durability
CREATE TABLE IF NOT EXISTS stored_files (
    file_name       VARCHAR(255) PRIMARY KEY,
    original_name   VARCHAR(255),
    content_type    VARCHAR(150) NOT NULL DEFAULT 'application/octet-stream',
    file_size       BIGINT NOT NULL DEFAULT 0,
    file_data       BYTEA NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Supplementary registration state on project_rounds
ALTER TABLE project_rounds
    ADD COLUMN IF NOT EXISTS supplementary_open BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Persistent digital signature on proposals (Stage 3)
ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS student_signed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS student_signed_at TIMESTAMP WITH TIME ZONE;

-- 4. Submissions cleanup: ensure all JPA columns exist, drop legacy NOT NULL columns,
--    and drop any legacy UNIQUE constraints blocking 2nd+ task revisions
DO $$
DECLARE
    col_rec RECORD;
    con_rec RECORD;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'title') THEN
        ALTER TABLE submissions ADD COLUMN title VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'submission_content') THEN
        ALTER TABLE submissions ADD COLUMN submission_content TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'file_url') THEN
        ALTER TABLE submissions ADD COLUMN file_url VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'review_feedback') THEN
        ALTER TABLE submissions ADD COLUMN review_feedback TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'reviewed_at') THEN
        ALTER TABLE submissions ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'submitted_at') THEN
        ALTER TABLE submissions ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Drop NOT NULL on any legacy columns in submissions not managed as required by Submission JPA entity
    FOR col_rec IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'submissions'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id', 'task_id', 'student_id', 'status', 'submitted_at', 'created_at', 'updated_at')
    LOOP
        EXECUTE format('ALTER TABLE submissions ALTER COLUMN %I DROP NOT NULL', col_rec.column_name);
    END LOOP;

    -- Drop any UNIQUE constraint on submissions (allow unlimited revision submissions per task/student)
    FOR con_rec IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'submissions'
          AND c.contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE submissions DROP CONSTRAINT IF EXISTS %I', con_rec.conname);
    END LOOP;
END $$;

-- 5. Manual assignment of eligible theses/students to a specific defense schedule session
CREATE TABLE IF NOT EXISTS defense_schedule_theses (
    id              BIGSERIAL PRIMARY KEY,
    schedule_id     BIGINT NOT NULL REFERENCES defense_schedules(id) ON DELETE CASCADE,
    thesis_id       BIGINT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    display_order   INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_defense_schedule_theses_thesis UNIQUE (thesis_id)
);

CREATE INDEX IF NOT EXISTS idx_defense_schedule_theses_schedule_id
    ON defense_schedule_theses(schedule_id);

-- 6. Digital signatures of all 5 council members on each thesis defense minutes
CREATE TABLE IF NOT EXISTS defense_minutes_signatures (
    id              BIGSERIAL PRIMARY KEY,
    thesis_id       BIGINT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    council_id      BIGINT NOT NULL REFERENCES defense_councils(id) ON DELETE CASCADE,
    lecturer_id     BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    member_role     VARCHAR(50) NOT NULL,
    signed_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_defense_minutes_sig_thesis_lecturer UNIQUE (thesis_id, lecturer_id)
);

CREATE INDEX IF NOT EXISTS idx_defense_minutes_sig_thesis_id
    ON defense_minutes_signatures(thesis_id);

-- 7. Group chat messages between Supervisor (GVHD) and supervised Students per project round
CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    lecturer_id     BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    sender_user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name     VARCHAR(150) NOT NULL,
    sender_role     VARCHAR(40) NOT NULL,
    content         TEXT NOT NULL,
    attachment_url  VARCHAR(500),
    attachment_name VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time
    ON chat_messages(project_round_id, lecturer_id, created_at);
