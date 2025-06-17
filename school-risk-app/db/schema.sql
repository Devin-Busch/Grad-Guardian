-- USERS (includes former students table fields)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(20),
  created_at TIMESTAMP DEFAULT now(),
  school_id INT REFERENCES schools(school_id),
  first_name TEXT,
  last_name TEXT,
  grade_level TEXT,
  support_staff TEXT,
  dew_score NUMERIC(5,2),
  total_score NUMERIC(5,3),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

-- DROPOUT RISK
CREATE TABLE IF NOT EXISTS dropout_risk (
  user_id INT PRIMARY KEY REFERENCES users(user_id),
  risk_score NUMERIC(5,3),
  risk_level VARCHAR(20)
);

-- DOMAIN SCORES
CREATE TABLE IF NOT EXISTS student_domain_scores (
  user_id INT REFERENCES users(user_id),
  domain_name TEXT,
  score INT
);

-- RISK FACTORS
CREATE TABLE IF NOT EXISTS risk_factors (
  factor_name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS student_risk_factors (
  user_id INT REFERENCES users(user_id),
  factor_name TEXT REFERENCES risk_factors(factor_name)
);

-- SUPPORTS
CREATE TABLE IF NOT EXISTS supports (
  user_id INT REFERENCES users(user_id),
  support_name TEXT
);

-- RISK FLAGS
CREATE TABLE IF NOT EXISTS risk_flags (
  user_id INT REFERENCES users(user_id),
  domain_name TEXT,
  flag_reason TEXT
);

-- SURVEY RESPONSES
CREATE TABLE IF NOT EXISTS survey_responses (
  user_id INT REFERENCES users(user_id),
  survey_num INT,
  question_num INT,
  response INT,
  PRIMARY KEY (user_id, survey_num, question_num)
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS student_documents (
  user_id INT REFERENCES users(user_id),
  filename TEXT,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  log_id SERIAL PRIMARY KEY,
  user_email TEXT,
  role TEXT,
  action TEXT,
  table_name TEXT,
  record_id INT,
  timestamp TIMESTAMP DEFAULT now(),
  changes JSONB
);
