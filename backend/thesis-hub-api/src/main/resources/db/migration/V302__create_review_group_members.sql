-- =============================================================================
-- Migration: V302__create_review_group_members.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: review_group_members (THANHVIENNHOMXETDUYET - ReviewGroupMember)
-- Description: Lecturers assigned as members of a proposal review group.
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_group_members (
    id                  BIGSERIAL PRIMARY KEY,
    group_id            BIGINT NOT NULL,
    lecturer_id         BIGINT NOT NULL,
    role                VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- A lecturer can only be in a group once
    CONSTRAINT uk_review_group_members_group_lecturer
        UNIQUE (group_id, lecturer_id),
    -- Role constraint
    CONSTRAINT chk_review_group_members_role
        CHECK (role IN ('LEADER', 'MEMBER'))
);
-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_review_group_members_group_id
    ON review_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_review_group_members_lecturer_id
    ON review_group_members(lecturer_id);