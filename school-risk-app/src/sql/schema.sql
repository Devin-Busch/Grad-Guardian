/* =======================================================
   School-Risk App — MASTER SCHEMA
   ======================================================= */

-- ---------- 1. Base school table (multi-tenant) ----------
CREATE TABLE IF NOT EXISTS schools (
  school_id     SERIAL PRIMARY KEY,
  school_name   TEXT,
  district_name TEXT
);

-- ---------- 2. Users & roles ----------
CREATE TABLE IF NOT EXISTS users (
  user_id         SERIAL PRIMARY KEY,
  email           VARCHAR(100) UNIQUE,
  role            VARCHAR(20),           -- system_admin, school_admin, teacher, student
  school_id       INT REFERENCES schools(school_id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ---------- 3. Students ----------
CREATE TABLE IF NOT EXISTS students (
    student_id     SERIAL PRIMARY KEY,
    school_id      INT REFERENCES schools(school_id),
    first_name     VARCHAR(50),
    last_name      VARCHAR(50),
    grade_level    VARCHAR(10),
    support_staff  VARCHAR(100),
    dew_score      NUMERIC(3,1),
    total_score    NUMERIC(5,3),
    risk_level     VARCHAR(15),
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- ---------- 4. Domains ----------
CREATE TABLE IF NOT EXISTS domains (
    domain_id   SERIAL PRIMARY KEY,
    domain_name VARCHAR(100) UNIQUE
);

INSERT INTO domains (domain_name) VALUES
('Risky Behaviors/Low Self-Worth'),
('Academic Disengagement'),
('Psychological Disengagement'),
('Poor School Performance')
ON CONFLICT (domain_name) DO NOTHING;

-- ---------- 5. Student ↔ domain scores ----------
CREATE TABLE IF NOT EXISTS student_domain_scores (
    id         SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    domain_id  INT REFERENCES domains(domain_id),
    score      INT CHECK (score BETWEEN 0 AND 3)
);

-- ---------- 6. Risk factors ----------
CREATE TABLE IF NOT EXISTS risk_factors (
    factor_id   SERIAL PRIMARY KEY,
    factor_name VARCHAR(150) UNIQUE,
    category    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS student_risk_factors (
    id         SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    factor_id  INT REFERENCES risk_factors(factor_id),
    severity   INT CHECK (severity BETWEEN 0 AND 3),
    notes      TEXT
);

-- ---------- 7. Supports ----------
CREATE TABLE IF NOT EXISTS supports (
    support_id        SERIAL PRIMARY KEY,
    student_id        INT REFERENCES students(student_id) ON DELETE CASCADE,
    current_supports  TEXT,
    previous_supports TEXT,
    external_supports TEXT,
    notes_from_staff  TEXT
);

-- ---------- 8. Audit log ----------
CREATE TABLE IF NOT EXISTS audit_log (
    log_id     SERIAL PRIMARY KEY,
    user_email VARCHAR(100),
    role       VARCHAR(20),
    school_id  INT,
    action     VARCHAR(50),
    table_name VARCHAR(50),
    record_id  INT,
    timestamp  TIMESTAMP DEFAULT NOW(),
    changes    JSONB
);
