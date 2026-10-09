# EVENTOPS 2026 — Backend Microservice & API Architecture

A high-performance, modular backend engine powering the **EVENTOPS 2026** platform for hackathons, collegiate symposiums, and enterprise event operations.

## 🚀 Architectural Highlights

1. **Modular Monolith Layering**:
   - Discrete modules for Auth, Events, Teams, Venues, Attendance, Judges, Rounds, Evaluation, Allocation, Volunteers, Resources, and Incidents.
   - Clean boundaries between HTTP Controllers, Business Logic Services, and Data Access Layers.
2. **Zero-Trust Multi-Tenant RBAC**:
   - Complete 9-role authorization matrix (`SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_ADMIN`, `COORDINATOR`, `JUDGE`, `VOLUNTEER`, `PARTICIPANT`, `TECHNICAL_STAFF`, `RESOURCE_MANAGER`).
   - Tenant isolation protecting corporate/university events alongside zero-setup Personal Event Mode.
3. **Cryptographic QR Attendance Engine**:
   - HMAC-SHA256 tamper-proof pass signing and zero-latency camera scanner verification.
4. **Constraint Optimization Pipeline**:
   - Formulation for Google OR-Tools CP-SAT solvers handling room capacities, power adjacency, jury domain matching, and conflict-of-interest exclusion.
5. **Real-Time WebSocket Pub/Sub**:
   - Bidirectional channels for live scoring, attendance velocity, and emergency incident dispatch.

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/              # Typed environment configuration
│   ├── database/            # PostgreSQL connection pool & relational schema.sql
│   ├── middleware/          # JWT Auth, RBAC Role Guards, Tenant Isolation, Audit Logger
│   ├── modules/
│   │   ├── auth/            # Authentication, JWT rotation, bcrypt password security
│   │   ├── events/          # Event lifecycle, stages, multi-track criteria
│   │   ├── teams/           # Team registration, rosters, project submissions
│   │   ├── venues/          # Halls, rooms, bench layouts & power/network mapping
│   │   ├── attendance/      # HMAC-SHA256 QR pass verification & check-in telemetry
│   │   ├── judges/          # Jury panel, domain expertise pairing
│   │   ├── rounds/          # Round advancement, cut-off quotas
│   │   ├── evaluation/      # Multi-criteria scoring rubrics & live leaderboard
│   │   ├── allocation/      # AI constraint builder & solver matching engine
│   │   ├── volunteers/      # Shift schedules, zone assignments, task checklists
│   │   ├── resources/       # Swag kits, meal vouchers, hardware checkout
│   │   ├── incidents/       # Incident reporting, severity triage (P1-P4), dispatch
│   │   └── analytics/       # Operations telemetry & security audit trails
│   ├── websocket/           # WebSocket real-time pub/sub server
│   ├── types/               # TypeScript domain interfaces
│   ├── app.ts               # Express application initialization & middleware stack
│   └── server.ts            # HTTP & WebSocket bootstrap listener
├── Dockerfile               # Multi-stage production container build
├── docker-compose.yml       # PostgreSQL 16 + Redis 7 + Backend orchestration
├── tsconfig.json            # Strict TypeScript configuration
└── package.json             # Service dependencies and scripts
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run with Hot Reload (Development)
```bash
npm run dev
```

The server starts at:
- **REST API**: `http://localhost:5000/api/v1`
- **WebSocket Engine**: `ws://localhost:5000/ws`
- **Health Check**: `http://localhost:5000/health`

### 3. Docker Deployment
```bash
docker compose up -d
```
Starts PostgreSQL, Redis, and EVENTOPS Backend automatically with initial database tables and indexes applied.
