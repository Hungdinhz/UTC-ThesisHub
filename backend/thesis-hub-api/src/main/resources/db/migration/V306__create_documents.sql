-- =============================================================================
-- Migration: V306__create_documents.sql
-- Module: Module 3 (Thesis & Progress) - Owner: Ngo Minh Quyet
-- Table: documents (TAILIEU - Document)
-- Description: Documents related to a thesis (source code, slides, report).
-- =============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id                  BIGSERIAL PRIMARY KEY,
    thesis_id           BIGINT NOT NULL,
    doc_type            VARCHAR(50) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(1000) NOT NULL,
    file_size           BIGINT, -- Size in bytes
    uploaded_by         BIGINT NOT NULL,
    version             INT NOT NULL DEFAULT 1,
    status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Status constraint
    CONSTRAINT chk_documents_status
        CHECK (status IN ('ACTIVE', 'DELETED', 'ARCHIVED')),
        
    -- Document type constraint
    CONSTRAINT chk_documents_type
        CHECK (doc_type IN ('PROPOSAL', 'PROGRESS_REPORT', 'FINAL_REPORT', 'SOURCE_CODE', 'SLIDE', 'OTHER'))
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_documents_thesis_id
    ON documents(thesis_id);

CREATE INDEX IF NOT EXISTS idx_documents_type
    ON documents(doc_type);
