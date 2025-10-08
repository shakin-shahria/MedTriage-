-- Schema for medtriage sessions
CREATE DATABASE IF NOT EXISTS medtriage_db;
USE medtriage_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  input_text TEXT NOT NULL,
  risk_level ENUM('low','medium','high') NOT NULL,
  predicted_conditions JSON NULL,
  next_step TEXT NOT NULL,
  confidence_score FLOAT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  endpoint VARCHAR(50) NOT NULL,
  fallback_to_rule BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
