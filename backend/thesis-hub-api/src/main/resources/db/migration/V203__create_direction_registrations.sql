CREATE TABLE direction_registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    project_direction_id INTEGER REFERENCES project_directions(id),
    project_round_id INTEGER,
    status VARCHAR(50) DEFAULT 'PENDING',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'LOCKED')),
    UNIQUE (student_id, project_round_id)
);
