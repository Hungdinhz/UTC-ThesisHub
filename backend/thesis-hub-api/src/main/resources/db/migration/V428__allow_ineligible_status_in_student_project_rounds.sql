-- Migration: V428__allow_ineligible_status_in_student_project_rounds.sql
-- Description: Allow INELIGIBLE and FORCE_APPROVED in student_project_rounds status check constraint

ALTER TABLE student_project_rounds DROP CONSTRAINT IF EXISTS chk_student_project_rounds_status;
ALTER TABLE student_project_rounds ADD CONSTRAINT chk_student_project_rounds_status CHECK (
    status IN ('ELIGIBLE', 'INELIGIBLE', 'FORCE_APPROVED', 'REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'DEFENSE_READY', 'DROPPED', 'DEFENDED', 'COMPLETED', 'PASSED', 'FAILED', 'RESERVED', 'CANCELLED')
);

