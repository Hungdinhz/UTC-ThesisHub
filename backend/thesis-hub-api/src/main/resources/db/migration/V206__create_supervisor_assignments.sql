CREATE TABLE supervisor_assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    lecturer_id INTEGER NOT NULL,
    project_round_id INTEGER NOT NULL,
    project_direction_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
    preference_order INTEGER,
    score INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, project_round_id)
);

CREATE TABLE assignment_history (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER,
    project_round_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
