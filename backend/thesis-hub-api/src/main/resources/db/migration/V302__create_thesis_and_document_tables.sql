-- =============================================================================
-- Migration: V302__create_thesis_and_document_tables.sql
-- Module: Module 3 (Thesis & Project Execution) - Owner: Ngo Minh Quyet
-- Tables: theses, documents
-- Description: Core tables for approved graduation theses and digital project documents.
-- =============================================================================

-- 5. THESES (DETAI - Đề tài đồ án / khóa luận tốt nghiệp chính thức)
CREATE TABLE IF NOT EXISTS theses (
    id                  BIGSERIAL PRIMARY KEY,
    proposal_id         BIGINT REFERENCES proposals(id) ON DELETE SET NULL,
    project_round_id    BIGINT NOT NULL REFERENCES project_rounds(id) ON DELETE CASCADE,
    student_id          BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lecturer_id         BIGINT NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    thesis_code         VARCHAR(100) UNIQUE,
    title_vn            VARCHAR(500) NOT NULL,
    title_en            VARCHAR(500),
    description         TEXT,
    objectives          TEXT,
    scope               TEXT,
    technologies        VARCHAR(500),
    status              VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    completion_rate     NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    defense_eligible    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_theses_student_round UNIQUE (student_id, project_round_id),
    CONSTRAINT chk_theses_status CHECK (
        status IN ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DEFENSE_READY', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_theses_completion_rate CHECK (
        completion_rate >= 0.00 AND completion_rate <= 100.00
    )
);

CREATE INDEX IF NOT EXISTS idx_theses_student_id ON theses(student_id);
CREATE INDEX IF NOT EXISTS idx_theses_round_id ON theses(project_round_id);
CREATE INDEX IF NOT EXISTS idx_theses_lecturer_id ON theses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_theses_proposal_id ON theses(proposal_id);
CREATE INDEX IF NOT EXISTS idx_theses_status ON theses(status);
CREATE INDEX IF NOT EXISTS idx_theses_defense_eligible ON theses(defense_eligible);

-- 6. DOCUMENTS (TAILIEU - Quản lý tài liệu, file đính kèm của đồ án)
CREATE TABLE IF NOT EXISTS documents (
    id            BIGSERIAL PRIMARY KEY,
    thesis_id     BIGINT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    uploader_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    file_size     BIGINT,
    mime_type     VARCHAR(100),
    version       INT NOT NULL DEFAULT 1,
    is_latest     BOOLEAN NOT NULL DEFAULT TRUE,
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_documents_type CHECK (
        document_type IN (
            'PROPOSAL',
            'INTERIM_REPORT',
            'FINAL_REPORT',
            'SOURCE_CODE',
            'PRESENTATION_SLIDE',
            'DEFENSE_MINUTES',
            'OTHER'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_documents_thesis_id ON documents(thesis_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_latest ON documents(is_latest);
