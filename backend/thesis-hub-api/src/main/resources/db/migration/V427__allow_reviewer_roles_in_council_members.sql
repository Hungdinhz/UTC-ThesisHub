-- =============================================================================
-- Migration: V427__allow_reviewer_roles_in_council_members.sql
-- Description: Expand check constraint on council_members.role to allow REVIEWER_1 and REVIEWER_2
-- Roles: PRESIDENT, SECRETARY, REVIEWER_1, REVIEWER_2, MEMBER
-- =============================================================================

ALTER TABLE council_members DROP CONSTRAINT IF EXISTS chk_council_members_role;

ALTER TABLE council_members ADD CONSTRAINT chk_council_members_role 
    CHECK (role IN ('PRESIDENT', 'SECRETARY', 'REVIEWER_1', 'REVIEWER_2', 'MEMBER'));

