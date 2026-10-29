-- V423: Remove DEFAULT 3.20 constraint from students and student_project_rounds
ALTER TABLE students ALTER COLUMN gpa DROP DEFAULT;
ALTER TABLE student_project_rounds ALTER COLUMN gpa DROP DEFAULT;
