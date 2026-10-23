-- =============================================================================
-- Migration: V412__fix_preferences_and_assignment_schema.sql
-- Module: Module 2 (Assignment / Preferences)
-- Description: Ensures legacy columns in preferences & supervisor_assignments
--              (such as priority_order) are nullable to prevent NOT NULL violations,
--              and automatically synchronizes priority_order with priority.
-- =============================================================================

DO $$
DECLARE
    col RECORD;
    r RECORD;
BEGIN
    -- 1. In preferences table, make any non-standard columns nullable (e.g., priority_order)
    FOR col IN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'preferences'
          AND column_name NOT IN ('id', 'student_id', 'project_round_id', 'lecturer_id', 'priority', 'gpa', 'prioritization_criteria', 'status', 'created_at', 'updated_at')
          AND is_nullable = 'NO'
    ) LOOP
        EXECUTE 'ALTER TABLE preferences ALTER COLUMN ' || quote_ident(col.column_name) || ' DROP NOT NULL';
    END LOOP;

    -- If priority column is missing or priority_order exists, ensure priority column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preferences' AND column_name = 'priority'
    ) THEN
        ALTER TABLE preferences ADD COLUMN priority INT;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preferences' AND column_name = 'priority_order'
    ) THEN
        EXECUTE 'UPDATE preferences SET priority = priority_order WHERE priority IS NULL';
        
        -- Create sync trigger between priority and priority_order
        EXECUTE $fn$
            CREATE OR REPLACE FUNCTION sync_preference_priority_order()
            RETURNS TRIGGER AS $trig$
            BEGIN
                IF NEW.priority_order IS NULL AND NEW.priority IS NOT NULL THEN
                    NEW.priority_order := NEW.priority;
                ELSIF NEW.priority IS NULL AND NEW.priority_order IS NOT NULL THEN
                    NEW.priority := NEW.priority_order;
                END IF;
                RETURN NEW;
            END;
            $trig$ LANGUAGE plpgsql;
        $fn$;

        DROP TRIGGER IF EXISTS trg_sync_preference_priority_order ON preferences;
        CREATE TRIGGER trg_sync_preference_priority_order
        BEFORE INSERT OR UPDATE ON preferences
        FOR EACH ROW
        EXECUTE FUNCTION sync_preference_priority_order();
    END IF;

    -- 2. In supervisor_assignments table, make any non-standard columns nullable
    FOR col IN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'supervisor_assignments'
          AND column_name NOT IN ('id', 'student_id', 'project_round_id', 'lecturer_id', 'assignment_method', 'preference_matched', 'status', 'is_locked', 'assigned_at', 'note', 'created_at', 'updated_at')
          AND is_nullable = 'NO'
    ) LOOP
        EXECUTE 'ALTER TABLE supervisor_assignments ALTER COLUMN ' || quote_ident(col.column_name) || ' DROP NOT NULL';
    END LOOP;

    -- 3. Drop legacy check constraints on preferences if any conflict
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'preferences'::regclass 
          AND contype = 'c'
    ) LOOP
        IF r.conname NOT IN ('chk_preference_priority', 'chk_preference_status') THEN
            EXECUTE 'ALTER TABLE preferences DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END IF;
    END LOOP;
END $$;
