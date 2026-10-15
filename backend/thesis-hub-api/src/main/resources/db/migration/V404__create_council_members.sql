-- =============================================================================
-- Migration: V404__create_council_members.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: council_members (THANHVIENHOIDONG - CouncilMember)
-- Description: Members assigned to a defense council.
-- Business rule (AGENTS.md):
-- 1. Council structure: 1 President (Chu tich), 2 Secretaries (Thu ky), 2 Members (Uy vien).
-- 2. Hard constraint: GVHD(s) NOT IN CouncilMembers(s) of that thesis.
-- =============================================================================

CREATE TABLE IF NOT EXISTS council_members (
    id                  BIGSERIAL PRIMARY KEY,
    council_id          BIGINT NOT NULL,
    lecturer_id         BIGINT NOT NULL,
    role                VARCHAR(30) NOT NULL,
    confirmed           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Role constraint: PRESIDENT (Chủ tịch), SECRETARY (Thư ký), MEMBER (Ủy viên)
    CONSTRAINT chk_council_members_role 
        CHECK (role IN ('PRESIDENT', 'SECRETARY', 'MEMBER')),

    -- A lecturer can only be assigned once per council
    CONSTRAINT uk_council_members_council_lecturer 
        UNIQUE (council_id, lecturer_id),

    -- Foreign keys referencing defense_councils and lecturers
    CONSTRAINT fk_council_members_council 
        FOREIGN KEY (council_id) REFERENCES defense_councils(id) ON DELETE CASCADE
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_council_members_council_id 
    ON council_members(council_id);

CREATE INDEX IF NOT EXISTS idx_council_members_lecturer_id 
    ON council_members(lecturer_id);

CREATE INDEX IF NOT EXISTS idx_council_members_role 
    ON council_members(role);
