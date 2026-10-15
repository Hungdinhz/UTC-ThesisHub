-- =============================================================================
-- Migration: V301__create_proposal_and_review_tables.sql
-- Module: Module 3 (Thesis & Project Execution) - Owner: Ngo Minh Quyet
-- Tables: review_groups, review_group_members, proposals, proposal_review_assignments
-- Description: Core tables for graduation thesis proposals and review groups.
-- =============================================================================

-- 1. REVIEW_GROUPS (NHOMXETDUYET - Nhóm / Tiểu ban xét duyệt đề cương)
CREATE TABLE IF NOT EXISTS review_groups (
    id               BIGSERIAL PRIMARY KEY,
    project_round_id BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    department_id    BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    code             VARCHAR(50) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    status           VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_review_groups_round_code UNIQUE (project_round_id, code),
    CONSTRAINT chk_review_groups_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISSOLVED'))
);

CREATE INDEX IF NOT EXISTS idx_review_groups_round_id ON review_groups(project_round_id);
CREATE INDEX IF NOT EXISTS idx_review_groups_department_id ON review_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_review_groups_status ON review_groups(status);

-- 2. REVIEW_GROUP_MEMBERS (THANHVIENNHOMXETDUYET - Thành viên nhóm xét duyệt)
CREATE TABLE IF NOT EXISTS review_group_members (
    id              BIGSERIAL PRIMARY KEY,
    review_group_id BIGINT NOT NULL REFERENCES review_groups(id) ON DELETE CASCADE,
    lecturer_id     BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    role            VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_review_group_members UNIQUE (review_group_id, lecturer_id),
    CONSTRAINT chk_review_group_members_role CHECK (role IN ('LEADER', 'SECRETARY', 'MEMBER'))
);

CREATE INDEX IF NOT EXISTS idx_review_group_members_group_id ON review_group_members(review_group_id);
CREATE INDEX IF NOT EXISTS idx_review_group_members_lecturer_id ON review_group_members(lecturer_id);

-- 3. PROPOSALS (DECUONG - Đề cương đồ án / khóa luận tốt nghiệp)
CREATE TABLE IF NOT EXISTS proposals (
    id                  BIGSERIAL PRIMARY KEY,
    project_round_id    BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    student_id          BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lecturer_id         BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    title_vn            VARCHAR(500) NOT NULL,
    title_en            VARCHAR(500),
    description         TEXT,
    objectives          TEXT,
    expected_results    TEXT,
    research_content    TEXT,
    file_url            VARCHAR(500),
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    supervisor_approved BOOLEAN NOT NULL DEFAULT FALSE,
    supervisor_comment  TEXT,
    version             INT NOT NULL DEFAULT 1,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_proposals_student_round UNIQUE (student_id, project_round_id),
    CONSTRAINT chk_proposals_status CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'APPROVED', 'REVISE_REQUIRED', 'REJECTED')
    )
);

CREATE INDEX IF NOT EXISTS idx_proposals_student_id ON proposals(student_id);
CREATE INDEX IF NOT EXISTS idx_proposals_round_id ON proposals(project_round_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lecturer_id ON proposals(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- 4. PROPOSAL_REVIEW_ASSIGNMENTS (PHANCONGXETDUYET - Phân công đề cương cho nhóm xét duyệt)
CREATE TABLE IF NOT EXISTS proposal_review_assignments (
    id               BIGSERIAL PRIMARY KEY,
    proposal_id      BIGINT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    review_group_id  BIGINT NOT NULL REFERENCES review_groups(id) ON DELETE CASCADE,
    assigned_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    evaluation_notes TEXT,
    decision_date    TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_proposal_review_assignments UNIQUE (proposal_id, review_group_id),
    CONSTRAINT chk_proposal_review_status CHECK (
        status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REVISE_REQUIRED', 'REJECTED')
    )
);

CREATE INDEX IF NOT EXISTS idx_proposal_reviews_proposal_id ON proposal_review_assignments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviews_group_id ON proposal_review_assignments(review_group_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviews_status ON proposal_review_assignments(status);
