-- =============================================================================
-- Migration: V418__allow_finalized_status_on_defense_councils.sql
-- Module: Module 4 & 5 (Eligibility & Defense)
-- Description: Allow FINALIZED and DRAFT status in defense_councils for council lock
-- =============================================================================

ALTER TABLE defense_councils DROP CONSTRAINT IF EXISTS chk_defense_councils_status;
ALTER TABLE defense_councils ADD CONSTRAINT chk_defense_councils_status 
    CHECK (status IN ('DRAFT', 'ACTIVE', 'FINALIZED', 'COMPLETED', 'CANCELLED'));
