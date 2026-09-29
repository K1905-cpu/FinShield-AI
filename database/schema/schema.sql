-- ====================================================================
-- FinShield AI Database Schema
-- Intelligent Financial Fraud & Risk Detection Platform
-- Compatible with Supabase PostgreSQL & SQLite / Relational RDBMS
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    risk_level VARCHAR(32) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    country VARCHAR(64) NOT NULL DEFAULT 'IN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    merchant VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(128) NOT NULL,
    payment_method VARCHAR(64) NOT NULL,
    device_id VARCHAR(128) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'legitimate' CHECK (status IN ('legitimate', 'under_review', 'suspicious', 'confirmed_fraud', 'dismissed')),
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(32) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON transactions(risk_level);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_score ON transactions(risk_score);

-- 4. Fraud Analysis Table (Explainable AI Engine Output)
CREATE TABLE IF NOT EXISTS fraud_analysis (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(32) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    fraud_probability DECIMAL(5, 2) NOT NULL,
    explanation TEXT NOT NULL,
    contributors JSONB NOT NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_analysis_tx ON fraud_analysis(transaction_id);

-- 5. Fraud Alerts Table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(14, 2) NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_type VARCHAR(128) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(64) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created ON fraud_alerts(created_at DESC);

-- 6. User Behavior Profile (Historical Baselines for Anomaly Detection)
CREATE TABLE IF NOT EXISTS user_behavior (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avg_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    max_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    frequent_locations JSONB NOT NULL DEFAULT '[]',
    known_devices JSONB NOT NULL DEFAULT '[]',
    common_categories JSONB NOT NULL DEFAULT '[]',
    total_transactions INTEGER NOT NULL DEFAULT 0,
    last_transaction_timestamp TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Fraud Rules Configuration (Configurable by Admin)
CREATE TABLE IF NOT EXISTS fraud_rules (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    high_value_threshold DECIMAL(14, 2) NOT NULL DEFAULT 50000.00,
    velocity_window_minutes INTEGER NOT NULL DEFAULT 10,
    velocity_count_threshold INTEGER NOT NULL DEFAULT 3,
    unusual_hours_start INTEGER NOT NULL DEFAULT 1,
    unusual_hours_end INTEGER NOT NULL DEFAULT 5,
    high_risk_categories JSONB NOT NULL,
    weights JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64) REFERENCES users(id)
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(64) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL CHECK (type IN ('transactions', 'fraud', 'suspicious', 'user_risk')),
    record_count INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    generated_by VARCHAR(64) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
