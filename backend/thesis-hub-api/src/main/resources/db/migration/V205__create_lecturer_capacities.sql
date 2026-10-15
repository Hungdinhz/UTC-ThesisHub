CREATE TABLE lecturer_capacities (
    id SERIAL PRIMARY KEY,
    lecturer_id INTEGER NOT NULL,
    project_round_id INTEGER NOT NULL,
    base_quota INTEGER NOT NULL,
    capacity_coefficient DECIMAL(4,2) DEFAULT 1.00,
    effective_capacity INTEGER NOT NULL,
    assigned_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lecturer_id, project_round_id)
);
