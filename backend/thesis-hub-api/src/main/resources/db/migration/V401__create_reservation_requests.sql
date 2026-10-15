-- =============================================================================
-- Migration: V401__create_reservation_requests.sql
-- Module: Module 4 (Eligibility & Defense) - Owner: Khuat Dang Khoa
-- Table: reservation_requests (DONBAOLUU - ReservationRequest)
-- Description: Stores student requests for thesis/academic reservation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS reservation_requests (
    id                  BIGSERIAL PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    thesis_id           BIGINT,
    project_round_id    BIGINT,
    reason              TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    submitted_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by         BIGINT,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,
    note                TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_reservation_requests_status 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

-- Indexes for frequent queries and filtering
CREATE INDEX IF NOT EXISTS idx_reservation_requests_student_id 
    ON reservation_requests(student_id);

CREATE INDEX IF NOT EXISTS idx_reservation_requests_thesis_id 
    ON reservation_requests(thesis_id);

CREATE INDEX IF NOT EXISTS idx_reservation_requests_project_round_id 
    ON reservation_requests(project_round_id);

CREATE INDEX IF NOT EXISTS idx_reservation_requests_status 
    ON reservation_requests(status);

CREATE INDEX IF NOT EXISTS idx_reservation_requests_submitted_at 
    ON reservation_requests(submitted_at);
