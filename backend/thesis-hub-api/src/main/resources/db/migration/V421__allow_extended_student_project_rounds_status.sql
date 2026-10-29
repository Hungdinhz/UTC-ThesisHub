-- Allow DEFENSE_READY, DEFENDED, COMPLETED, PASSED, FAILED, CANCELLED in student_project_rounds table
ALTER TABLE student_project_rounds DROP CONSTRAINT IF EXISTS chk_student_project_rounds_status;
ALTER TABLE student_project_rounds ADD CONSTRAINT chk_student_project_rounds_status CHECK (
    status IN ('ELIGIBLE', 'REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'DEFENSE_READY', 'DROPPED', 'DEFENDED', 'COMPLETED', 'PASSED', 'FAILED', 'RESERVED', 'CANCELLED')
);

