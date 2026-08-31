CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE councils (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE council_members (
    council_id INTEGER REFERENCES councils(id),
    user_id INTEGER REFERENCES users(id),
    role_in_council VARCHAR(50),
    PRIMARY KEY (council_id, user_id)
);

ALTER TABLE thesis_topics
ADD COLUMN semester_id INTEGER REFERENCES semesters(id),
ADD COLUMN council_id INTEGER REFERENCES councils(id),
ADD COLUMN supervisor_score DECIMAL(5,2);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES thesis_topics(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    status VARCHAR(50) DEFAULT 'TODO'
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP
);
