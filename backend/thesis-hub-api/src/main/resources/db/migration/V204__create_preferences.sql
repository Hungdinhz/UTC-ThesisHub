CREATE TABLE preferences (
    id SERIAL PRIMARY KEY,
    direction_registration_id INTEGER REFERENCES direction_registrations(id),
    lecturer_id INTEGER REFERENCES users(id),
    priority_order INTEGER NOT NULL,
    extra_criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (direction_registration_id, lecturer_id),
    UNIQUE (direction_registration_id, priority_order)
);
