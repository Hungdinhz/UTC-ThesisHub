-- =============================================================================
-- Migration: V415__fix_module2_foreign_key_constraints.sql
-- Module: Module 2 (Assignment & Direction Selection)
-- Description: Fixes legacy foreign key constraints where student_id and lecturer_id
--              pointed to users(id) instead of students(id) and lecturers(id).
-- =============================================================================

DO $$
BEGIN
    -- 1. Fix direction_registrations
    -- Drop legacy foreign keys pointing to users(id) or legacy columns
    ALTER TABLE direction_registrations DROP CONSTRAINT IF EXISTS direction_registrations_student_id_fkey;
    ALTER TABLE direction_registrations DROP CONSTRAINT IF EXISTS direction_registrations_project_direction_id_fkey;
    ALTER TABLE direction_registrations DROP CONSTRAINT IF EXISTS direction_registrations_direction_id_fkey;
    ALTER TABLE direction_registrations DROP CONSTRAINT IF EXISTS direction_registrations_round_id_fkey;

    -- Add correct foreign keys to students, project_directions, and project_rounds
    ALTER TABLE direction_registrations 
        ADD CONSTRAINT direction_registrations_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

    ALTER TABLE direction_registrations 
        ADD CONSTRAINT direction_registrations_direction_id_fkey 
        FOREIGN KEY (direction_id) REFERENCES project_directions(id) ON DELETE CASCADE;

    ALTER TABLE direction_registrations 
        ADD CONSTRAINT direction_registrations_round_id_fkey 
        FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE;

    -- 2. Fix preferences
    -- Drop legacy foreign keys pointing to users(id)
    ALTER TABLE preferences DROP CONSTRAINT IF EXISTS preferences_lecturer_id_fkey;
    ALTER TABLE preferences DROP CONSTRAINT IF EXISTS preferences_student_id_fkey;
    ALTER TABLE preferences DROP CONSTRAINT IF EXISTS preferences_project_round_id_fkey;

    -- Add correct foreign keys to lecturers, students, and project_rounds
    ALTER TABLE preferences 
        ADD CONSTRAINT preferences_lecturer_id_fkey 
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE;

    ALTER TABLE preferences 
        ADD CONSTRAINT preferences_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

    ALTER TABLE preferences 
        ADD CONSTRAINT preferences_project_round_id_fkey 
        FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE;

    -- 3. Fix lecturer_directions
    -- Drop legacy foreign key pointing to users(id) or project_direction_id
    ALTER TABLE lecturer_directions DROP CONSTRAINT IF EXISTS lecturer_directions_lecturer_id_fkey;
    ALTER TABLE lecturer_directions DROP CONSTRAINT IF EXISTS lecturer_directions_project_direction_id_fkey;
    ALTER TABLE lecturer_directions DROP CONSTRAINT IF EXISTS lecturer_directions_direction_id_fkey;

    -- Add correct foreign keys to lecturers and project_directions
    ALTER TABLE lecturer_directions 
        ADD CONSTRAINT lecturer_directions_lecturer_id_fkey 
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE;

    ALTER TABLE lecturer_directions 
        ADD CONSTRAINT lecturer_directions_direction_id_fkey 
        FOREIGN KEY (direction_id) REFERENCES project_directions(id) ON DELETE CASCADE;

    -- 4. Fix supervisor_assignments
    ALTER TABLE supervisor_assignments DROP CONSTRAINT IF EXISTS supervisor_assignments_student_id_fkey;
    ALTER TABLE supervisor_assignments DROP CONSTRAINT IF EXISTS supervisor_assignments_lecturer_id_fkey;
    ALTER TABLE supervisor_assignments DROP CONSTRAINT IF EXISTS supervisor_assignments_round_id_fkey;
    ALTER TABLE supervisor_assignments DROP CONSTRAINT IF EXISTS supervisor_assignments_direction_id_fkey;

    ALTER TABLE supervisor_assignments 
        ADD CONSTRAINT supervisor_assignments_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

    ALTER TABLE supervisor_assignments 
        ADD CONSTRAINT supervisor_assignments_lecturer_id_fkey 
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE;

    ALTER TABLE supervisor_assignments 
        ADD CONSTRAINT supervisor_assignments_round_id_fkey 
        FOREIGN KEY (project_round_id) REFERENCES project_rounds(id) ON DELETE CASCADE;

    ALTER TABLE supervisor_assignments 
        ADD CONSTRAINT supervisor_assignments_direction_id_fkey 
        FOREIGN KEY (direction_id) REFERENCES project_directions(id) ON DELETE SET NULL;
END $$;
