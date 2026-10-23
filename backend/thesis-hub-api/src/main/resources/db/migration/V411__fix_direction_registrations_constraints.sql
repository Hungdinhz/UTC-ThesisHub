-- =============================================================================
-- Migration: V411__fix_direction_registrations_constraints.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Removes conflicting legacy check constraints (such as chk_status)
--              on direction_registrations and establishes standard constraint.
-- =============================================================================

DO $$
DECLARE
    r RECORD;
    col RECORD;
BEGIN
    -- 1. Drop any legacy check constraints on direction_registrations
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'direction_registrations'::regclass 
          AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE direction_registrations DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    -- 2. Add back the standard check constraint
    ALTER TABLE direction_registrations 
        ADD CONSTRAINT chk_direction_reg_status 
        CHECK (status IN ('REGISTERED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'));

    -- 3. Ensure any legacy extra columns are nullable
    FOR col IN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'direction_registrations'
          AND column_name NOT IN ('id', 'student_id', 'project_round_id', 'direction_id', 'status', 'registered_at', 'created_at', 'updated_at')
          AND is_nullable = 'NO'
    ) LOOP
        EXECUTE 'ALTER TABLE direction_registrations ALTER COLUMN ' || quote_ident(col.column_name) || ' DROP NOT NULL';
    END LOOP;
END $$;
