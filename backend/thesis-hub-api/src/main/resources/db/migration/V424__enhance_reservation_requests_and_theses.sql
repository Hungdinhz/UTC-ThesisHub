-- =============================================================================
-- Migration: V424__enhance_reservation_requests_and_theses.sql
-- Module: Module 4 (Eligibility & Defense)
-- Description: Enhance reservation requests with category, evidence files, supervisor confirmation
--              and allow 'RESERVED' status on theses.
-- =============================================================================

-- 1. Add reason_category, evidence file and supervisor feedback to reservation_requests
ALTER TABLE reservation_requests 
    ADD COLUMN IF NOT EXISTS reason_category VARCHAR(50) DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS evidence_file_url TEXT,
    ADD COLUMN IF NOT EXISTS evidence_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS supervisor_approved BOOLEAN DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS supervisor_comment TEXT,
    ADD COLUMN IF NOT EXISTS target_round_code VARCHAR(50);

-- Constraint for reservation reason category
ALTER TABLE reservation_requests DROP CONSTRAINT IF EXISTS chk_reservation_requests_category;
ALTER TABLE reservation_requests ADD CONSTRAINT chk_reservation_requests_category 
    CHECK (reason_category IN (
        'INSUFFICIENT_CREDITS', 
        'SUPERVISOR_NOT_ELIGIBLE',
        'RESEARCH_PROGRESS', 
        'HEALTH_REASONS', 
        'INTERNSHIP_WORK', 
        'FAMILY_CIRCUMSTANCES', 
        'OTHER'
    ));

-- 2. Update theses check constraint to allow 'RESERVED'
ALTER TABLE theses DROP CONSTRAINT IF EXISTS chk_theses_status;
ALTER TABLE theses ADD CONSTRAINT chk_theses_status CHECK (
    status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 
        'UNDER_REVIEW', 'DEFENSE_READY', 'DEFENSE_NOT_ELIGIBLE', 
        'RESERVED', 'COMPLETED', 'CANCELLED', 'CANCELED', 
        'REVISION_REQUIRED', 'REJECTED'
    )
);

-- 3. Create indexes for fast query by round and status
CREATE INDEX IF NOT EXISTS idx_reservation_requests_round_status 
    ON reservation_requests(project_round_id, status);
CREATE INDEX IF NOT EXISTS idx_reservation_requests_category 
    ON reservation_requests(reason_category);
