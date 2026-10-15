-- =============================================================================
-- Migration: V100__create_identity_and_organization_tables.sql
-- Module: Module 1 (Identity & Organization) - Owner: Phung Dinh Hung
-- Tables: faculties, departments, majors, training_programs, roles, users, students, lecturers, notifications
-- Description: Core master data for identity, organizational structure, and notifications.
-- =============================================================================

-- 1. FACULTIES (Khoa)
CREATE TABLE IF NOT EXISTS faculties (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);

-- 2. DEPARTMENTS (Bộ môn trực thuộc Khoa)
CREATE TABLE IF NOT EXISTS departments (
    id          BIGSERIAL PRIMARY KEY,
    faculty_id  BIGINT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

-- 3. MAJORS (Ngành đào tạo)
CREATE TABLE IF NOT EXISTS majors (
    id            BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    faculty_id    BIGINT REFERENCES faculties(id) ON DELETE SET NULL,
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_majors_department_id ON majors(department_id);
CREATE INDEX IF NOT EXISTS idx_majors_faculty_id ON majors(faculty_id);
CREATE INDEX IF NOT EXISTS idx_majors_code ON majors(code);

-- 4. TRAINING_PROGRAMS (Chương trình đào tạo: Cử nhân / Kỹ sư)
CREATE TABLE IF NOT EXISTS training_programs (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(50) NOT NULL UNIQUE,
    name           VARCHAR(100) NOT NULL,
    duration_years NUMERIC(3,1) NOT NULL DEFAULT 4.0,
    total_credits  INT,
    description    TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_programs_code ON training_programs(code);

-- 5. ROLES (Vai trò người dùng)
CREATE TABLE IF NOT EXISTS roles (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- 6. USERS (Tài khoản người dùng)
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    VARCHAR(500),
    role_id       BIGINT NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 7. STUDENTS (Hồ sơ Sinh viên)
CREATE TABLE IF NOT EXISTS students (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_code        VARCHAR(50) NOT NULL UNIQUE,
    class_name          VARCHAR(100),
    major_id            BIGINT REFERENCES majors(id) ON DELETE SET NULL,
    training_program_id BIGINT REFERENCES training_programs(id) ON DELETE SET NULL,
    date_of_birth       DATE,
    gender              VARCHAR(10),
    debt_credits        INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_major_id ON students(major_id);
CREATE INDEX IF NOT EXISTS idx_students_training_program_id ON students(training_program_id);

-- 8. LECTURERS (Hồ sơ Giảng viên)
CREATE TABLE IF NOT EXISTS lecturers (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    lecturer_code       VARCHAR(50) NOT NULL UNIQUE,
    department_id       BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    academic_degree     VARCHAR(50) NOT NULL,
    research_interests  TEXT,
    max_thesis_quota    INT NOT NULL DEFAULT 5,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_lecturers_degree 
        CHECK (academic_degree IN ('THAC_SI', 'TIEN_SI', 'PGS', 'GS', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_lecturers_user_id ON lecturers(user_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_lecturer_code ON lecturers(lecturer_code);
CREATE INDEX IF NOT EXISTS idx_lecturers_department_id ON lecturers(department_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_academic_degree ON lecturers(academic_degree);

-- 9. NOTIFICATIONS (Thông báo hệ thống)
CREATE TABLE IF NOT EXISTS notifications (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    content       TEXT NOT NULL,
    type          VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    reference_url VARCHAR(500),
    is_read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
