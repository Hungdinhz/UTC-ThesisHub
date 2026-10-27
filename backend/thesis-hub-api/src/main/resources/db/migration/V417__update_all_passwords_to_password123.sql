-- Migration: V417__update_all_passwords_to_password123.sql
-- Description: Standardize all accounts passwords to Password@123 ($2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.)
UPDATE users
SET password = '$2a$10$oCLjZ/mDafFVyQc8nRW0COifZhx3p/AZBeynVP4qU0NcQjfc9EXQ.',
    is_active = TRUE;
