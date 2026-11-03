-- =============================================================================
-- Migration: V425__add_revision_fields_to_proposals.sql
-- Module: Module 3 (Thesis Proposal Review & Revisions)
-- Description: Add fields to support structured proposal revision workflows:
--              rebuttal_notes (student's explanation of changes),
--              revision_checklist (structured checklist items requiring fixes),
--              council_comment (feedback from review committee/faculty),
--              revision_deadline (deadline for resubmission).
-- =============================================================================

ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS rebuttal_notes TEXT,
    ADD COLUMN IF NOT EXISTS revision_checklist TEXT,
    ADD COLUMN IF NOT EXISTS council_comment TEXT,
    ADD COLUMN IF NOT EXISTS revision_deadline TIMESTAMP WITH TIME ZONE;

