CREATE TABLE lecturer_directions (
    id SERIAL PRIMARY KEY,
    lecturer_id INTEGER REFERENCES users(id),
    project_direction_id INTEGER REFERENCES project_directions(id),
    UNIQUE (lecturer_id, project_direction_id)
);
