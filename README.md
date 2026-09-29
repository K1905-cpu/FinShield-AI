# FinShield AI
### Intelligent Financial Fraud & Risk Detection Platform

> **Intelligent protection for every transaction.**

---

## 📌 Disclaimer & Project Classification

**FinShield AI** is an academic final-year/capstone engineering project designed to demonstrate full-stack software development, explainable artificial intelligence (XAI) risk heuristics, security engineering, and financial data analytics. 

It runs on **realistic simulated financial transaction telemetry** and is **not** connected to real banking networks, payment gateways, live credit card processing, or real money transfers.

---

## 🚀 Project Overview

Financial fraud represents billions in global losses annually. Conventional fraud systems often operate as opaque "black boxes," leaving fraud analysts, compliance officers, and customers unable to understand why a transaction was flagged or declined.

**FinShield AI** bridges this critical gap with a **transparent, explainable 7-factor risk scoring engine** combined with real-time operations dashboards, automated alert escalation, personal financial intelligence, and forensic audit logging.

---

## 🎯 Core Objectives

1. **Deterministic Transparent Scoring**: Replace opaque black-box decisions with a clear 100-point scoring model based on mathematical deviations.
2. **Explainable AI (XAI)**: Synthesize dynamic, human-readable explanations detailing why a transaction was flagged and what specific factors contributed.
3. **Role-Based Workflows**: Tailored, secure interfaces for **Admin** (system oversight & rules), **Analyst** (incident triage & SAR reports), and **User** (personal finances & spending insights).
4. **Live Presentation Simulations**: Built-in 1-click simulation tools to inject low-risk and high-threat financial intrusions live during project evaluation.
5. **Robust Data Ingestion**: High-throughput transaction querying with pagination, multi-column filtering, and bulk CSV manifest import with automated batch scanning.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8 | Ultra-fast, type-safe reactive single-page interface |
| **Styling** | Tailwind CSS v3, PostCSS, Autoprefixer | High-contrast fintech design with Light/Dark mode |
| **Visualization** | Recharts, Lucide React, Framer Motion | Dynamic telemetry timelines, donut charts, risk curves |
| **Backend** | Node.js v24, Express, TypeScript | High-performance modular REST API services |
| **Scoring Engine**| Deterministic Explainable Heuristic Engine | Transparent 7-factor scoring (0–100 points) |
| **Database** | Relational JSON RDBMS / Supabase PostgreSQL | Fully persisted, indexed relational store with foreign keys |
| **Security** | JWT Authentication, BcryptJS, RBAC | Role-based authorization & tamper-evident audit logs |

---

## 📐 System Architecture

```text
[ Browser Client (React 19 + TypeScript + Vite) ]
        │
        ├── Dark / Light Mode Theme Engine
        ├── Role-Based Router Guards (Admin / Analyst / User)
        └── Real-Time Telemetry Dashboards (Recharts)
        │
        ▼ (REST API / JSON / JWT)
[ Express API Server (Node.js + TypeScript) ]
        │
        ├── Authentication & Authorization Middleware
        ├── Immutable Security Audit Logger
        ├── Transaction & Alert Controllers
        │
        ├──► [ FinShield Explainable Fraud Scoring Engine ]
        │       ├── 1. Amount Anomaly (20 pts)
        │       ├── 2. Velocity / Frequency Burst (20 pts)
        │       ├── 3. Geolocation Jump (15 pts)
        │       ├── 4. Unusual Off-Peak Time (10 pts)
        │       ├── 5. Merchant Risk & Payment Rail (15 pts)
        │       ├── 6. Unfamiliar Device Signature (10 pts)
        │       └── 7. Behavioral Baseline Divergence (10 pts)
        │
        ▼
[ Database Layer (ACID Relational Persistence / Supabase Compatible) ]
        ├── users (7 Pre-seeded accounts)
        ├── transactions (1,000+ realistic simulated records)
        ├── fraud_analysis (Factor breakdowns & dynamic explanations)
        ├── fraud_alerts (Escalated compliance cases)
        ├── fraud_rules (Admin-configurable weights & thresholds)
        └── audit_logs (Forensic security trails)
```

---

## 🧠 Explainable Fraud Detection Methodology

FinShield rejects unverifiable black-box AI claims. Instead, it implements a **calibrated, transparent 7-factor scoring model totaling 100 points**:

| # | Factor | Max Points | Evaluation Heuristic |
|---|:---|:---:|:---|
| 1 | **Amount Anomaly** | **20 pts** | Compares current amount against user's historical spend average and the global threshold (default ₹50,000). Ratios $\ge 6\times$ trigger full 20 points. |
| 2 | **Velocity & Frequency** | **20 pts** | Tracks transaction count within a rolling window (default 10 min). $\ge 4$ transactions trigger 20 points. |
| 3 | **Geolocation Deviation** | **15 pts** | Compares city against user's frequent cities profile and flags impossible travel speeds ($<2$ hrs between distant cities). |
| 4 | **Unusual Hour Anomaly** | **10 pts** | Detects transactions executed during off-peak sleeping hours (default 01:00 AM – 05:00 AM). |
| 5 | **Merchant & Rail Risk** | **15 pts** | Flags high-risk categories (Crypto Exchanges, Online Gambling, Unregulated Remittance) and irreversible rails (Wire Transfer). |
| 6 | **Device Signature Anomaly** | **10 pts** | Identifies hardware signatures never before associated with the user's historical profile. |
| 7 | **Behavioral Divergence** | **10 pts** | Detects category departures combined with ticket sizes exceeding 1.8x typical average. |

### Risk Level Stratification:
* `0 – 29` : **LOW** (Routine transaction, cleared automatically)
* `30 – 59` : **MEDIUM** (Under review, moderate baseline divergence)
* `60 – 79` : **HIGH** (Suspicious, triggers automated compliance alert)
* `80 – 100` : **CRITICAL** (Confirmed fraud probability, immediate analyst escalation)

---

## 🔑 Demo Accounts & Viva Credentials

For seamless viva examination and project demonstration, three pre-configured accounts are provided with **1-click autofill buttons** on the login page:

| Persona | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@finshield.ai` | `Admin@123` | Full administrative access: Fraud rules configuration, user management, audit logs, all transactions & alerts. |
| **Analyst** | `analyst@finshield.ai` | `Analyst@123` | Fraud investigation access: SAR reports, alert dispositioning, transaction dossier reviews, analytics. |
| **Retail User** | `user@finshield.ai` | `User@123` | Retail cardholder (Kalp Shah): Personal finance dashboard, spending categories, AI insights, CSV upload. |

---

## ⚡ Quick Start & Running Locally

### Prerequisites
* **Node.js**: v18.0.0 or higher (v24 LTS recommended)
* **npm**: v9.0.0 or higher

### 1. Installation
Clone or navigate to the project directory:
```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm install --prefix server
npm install --prefix client --legacy-peer-deps
```

### 2. Environment Configuration
Copy the provided `.env.example` file:
```bash
cp .env.example .env
cp .env.example server/.env
```
*(The embedded database operates automatically out of the box with zero external configuration required).*

### 3. Database Seeding
To populate the database with ~1,000 realistic transactions, behavioral profiles, and demo users:
```bash
npm run seed
```

### 4. Run the Full-Stack Application
Start both the backend API server and frontend client concurrently:
```bash
npm run dev
```
* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000`
* **API Health Check**: `http://localhost:5000/api/health`

---

## 🎬 Viva Demonstration Step-by-Step Flow

Follow this exact walkthrough during your presentation:

1. **Open Landing Page** (`http://localhost:5173`):
   * Point out the **FinShield AI** branding, tagline, and the 6-step interactive pipeline.
2. **Sign In as Admin**:
   * Click **"Launch Admin Demo"** or click the **"Admin Demo"** chip on the login page.
3. **Showcase Main Dashboard**:
   * Highlight the **6 calculated KPI cards** (Total Transactions > 1,000, Total Value ₹95L+, Suspicious, Confirmed Fraud, Avg Risk Score, Money at Risk).
   * Review the **Transaction Volume Timeline** and **Risk Distribution** charts.
4. **Trigger Live Fraud Attack Simulation**:
   * In the top banner, click **"Simulate Suspicious Tx (₹85k / 2:47 AM)"**.
   * Observe the simulation result modal displaying the calculated score (e.g. `72/100 HIGH`), triggered alert ID, and synthesized explanation.
5. **Inspect the Explainable AI Dossier**:
   * Click **"View Complete Dossier"** or click any transaction in the ledger.
   * Review the **Root Cause Synthesis** and the individual **factor progress bars**.
   * Change the investigation status to **Confirmed Fraud** (noting that this action immediately creates an audit log entry).
6. **Navigate to Fraud Alerts**:
   * Show the active alert queue with severity pills (`CRITICAL`, `HIGH`, `MEDIUM`).
7. **Demonstrate the Fraud Engine Sandbox** (`/fraud-detection`):
   * Select the **"Attack Preset"** and click **"Execute Fraud Engine Analysis"**.
   * Observe the deterministic calculation and how changes in parameters instantly reflect in points.
8. **Inspect Multivariate Analytics** (`/analytics`):
   * Show the **24-Hour Fraud Activity Curve** highlighting the off-peak nocturnal attack peak.
9. **Log in as Retail User** (`user@finshield.ai`):
   * Navigate to **My Finance** (`/my-finance`).
   * Show personal monthly spend, weekly velocity, and the dynamically generated **FinShield AI Personalized Behavioral Insights**.

---

## 📂 CSV Batch Manifest Specification

The CSV import endpoint (`/api/transactions/upload`) accepts standard manifests with the following headers:

```csv
transaction_id,user_id,timestamp,amount,currency,merchant,category,location,payment_method,device_id
TXN-CSV-001,usr_user_001,2026-09-29T14:30:00Z,1850,INR,Amazon India,Shopping,Mumbai,credit_card,DEV-IPHONE-15-KALP
TXN-CSV-002,usr_user_001,2026-09-29T02:47:00Z,92000,INR,Apex Crypto OTC,Crypto Exchange,Dubai (AE),wire_transfer,DEV-UNKNOWN-TOR-99
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and database statistics |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT session |
| `POST` | `/api/auth/register` | Register retail user account |
| `GET` | `/api/dashboard` | Aggregated KPI metrics and chart datasets |
| `GET` | `/api/transactions` | Paginated transactions with search and multi-column filters |
| `POST` | `/api/transactions` | Submit transaction with real-time scoring |
| `GET` | `/api/transactions/:id` | Fetch complete explainable transaction dossier |
| `PATCH`| `/api/transactions/:id/status` | Update transaction status (Analyst/Admin) |
| `POST` | `/api/transactions/upload` | CSV batch manifest upload and automated scan |
| `POST` | `/api/fraud/analyze` | Sandbox transaction scoring without persistence |
| `GET` | `/api/fraud/matrix` | Current 7-factor weights and threshold rules |
| `GET` | `/api/alerts` | Active and resolved compliance alerts |
| `PATCH`| `/api/alerts/:id` | Update alert triage status |
| `GET` | `/api/analytics` | Deep multivariate fraud analytics |
| `GET` | `/api/personal-finance` | User spend summary and AI insights |
| `POST` | `/api/simulation/normal` | Dispatch simulated low-risk transaction |
| `POST` | `/api/simulation/suspicious` | Dispatch simulated high-risk fraud attack |
| `GET` | `/api/admin/users` | User management directory (Admin only) |
| `GET` | `/api/admin/rules` | Fetch active fraud rules configuration (Admin only) |
| `PATCH`| `/api/admin/rules` | Update threshold rules and weights (Admin only) |
| `GET` | `/api/admin/audit-logs` | Forensic security audit logs (Admin only) |
| `GET` | `/api/reports` | Compliance reports archive |
| `POST` | `/api/reports/generate` | Generate audit report with CSV export |

---

## 🛡️ License

Developed for Academic and Final-Year Project Demonstration. All rights reserved.
