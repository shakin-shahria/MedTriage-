-- Schema for medtriage sessions
CREATE DATABASE IF NOT EXISTS medtriage_db;
USE medtriage_db;

CREATE TABLE IF NOT EXISTS sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  input_text TEXT NOT NULL,
  risk_level ENUM('low','medium','high') NOT NULL,
  predicted_conditions JSON NULL,
  next_step TEXT NOT NULL,
  confidence_score FLOAT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  endpoint VARCHAR(50) NOT NULL,
  fallback_to_rule BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
