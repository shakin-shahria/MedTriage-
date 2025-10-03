-- Simple schema for quick testing: simple_sessions
-- Run this against your MySQL server to create a minimal table for storing sessions
-- Example: mysql -u medtriage_db -p'1234' medtriage_db < simple_schema.sql

CREATE DATABASE IF NOT EXISTS medtriage_db;
USE medtriage_db;

CREATE TABLE IF NOT EXISTS simple_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  input_text TEXT NOT NULL,
  risk_level VARCHAR(16) NOT NULL,
  next_step VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example insert (for quick testing):
-- INSERT INTO simple_sessions (input_text, risk_level, next_step) VALUES ('Mild headache', 'Low', 'Self-care');

-- Example select:
-- SELECT id, input_text, risk_level, next_step, created_at FROM simple_sessions ORDER BY id DESC LIMIT 20;
