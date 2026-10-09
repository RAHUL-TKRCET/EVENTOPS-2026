# EVENTOPS-2026

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.1-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.3-61dafb.svg)](https://react.dev/)
[![Google OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT_v9.15-orange.svg)](https://developers.google.com/optimization)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-Grade Event Operations & Hackathon Management Platform for VISTERA 2026**  
> High-concurrency operations, mathematical constraint optimization with Google OR-Tools CP-SAT, Zero-Trust Role-Based Access Control across 9 roles, cryptographic HMAC-SHA256 QR verification, and dual deployment architecture (FastAPI Cloud backend + Next.js static export on GitHub Pages).

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Technology Stack](#-technology-stack)
3. [FastAPI Cloud Deployment & Startup Configuration](#-fastapi-cloud-deployment--startup-configuration)
4. [GitHub Pages Frontend Static Export](#-github-pages-frontend-static-export)
5. [Mathematical Optimization (Google OR-Tools CP-SAT)](#-mathematical-optimization-google-or-tools-cp-sat)
6. [Security, RBAC & Cryptographic QR Verification](#-security-rbac--cryptographic-qr-verification)
7. [Local Quickstart & Execution Guide](#-local-quickstart--execution-guide)
8. [Automated Verification & Testing](#-automated-verification--testing)
9. [Environment Variables Reference](#-environment-variables-reference)
10. [API Diagnostics & OpenAPI Documentation](#-api-diagnostics--openapi-documentation)

---

## 🏛 Architectural Overview

EVENTOPS-2026 enforces a clean separation of concerns between client-side user experience, edge delivery, and a high-performance Python ASGI backend.

```
                           +--------------------------------------------+
                           |           Client Web Browsers              |
                           +--------------------------------------------+
                                        /                  \
                    Static Assets / UI /                    \ REST / WebSocket
                                      /                      \
             +------------------------------+     +-------------------------------+
             |        GitHub Pages          |     |         FastAPI Cloud         |
             |  (Next.js Static Export out) |     |      (Python 3.11 ASGI)       |
             |  - 122 Pre-rendered Pages    |     |  - Root Entrypoint: main:app  |
             |  - Client-Side JWT Auth      |     |  - 10 Modular Route Handlers  |
             |  - Dynamic Route Param Gen   |     |  - OpenAPI 3.1 Auto-Docs      |
             +------------------------------+     +-------------------------------+
                                                                 |
                                       +-------------------------+-------------------------+
                                       |                         |                         |
                        +----------------------------+   +-------------------+   +--------------------+
                        |       PostgreSQL 16        |   |  Google OR-Tools  |   |    WebSocket Hub   |
                        | (Persistent Storage & RLS) |   |  (CP-SAT Solver)  |   | (Live Event State) |
                        +----------------------------+   +-------------------+   +--------------------+
```

### System Workflows & Roles

The system supports **9 isolated administrative and operational roles**:
1. **Super Admin** (`/super-admin`): Multi-tenant organization creation, platform governance, and global audit logging.
2. **Event Admin** (`/events`): Event lifecycle management, venue and track allocations, schedule coordination.
3. **Coordinator** (`/events/[eventId]/coordinators`): Operational logistics, volunteer oversight, and equipment assignments.
4. **Track Lead** (`/rounds`): Round management, criteria definitions, team progression pipelines.
5. **Judge** (`/judge`, `/judge/teams`): Evaluation rubrics, real-time score submissions, conflict-of-interest protections.
6. **Volunteer** (`/volunteer/checkin`, `/scanner`): Camera-accelerated QR code badge scanning and hardware verification.
7. **Mentor** (`/mentor/requests`): Helpdesk queue, team mentorship sessions, real-time advice logging.
8. **Sponsor** (`/sponsor/portal`): Booth tracking, challenge problem statements, sponsored award evaluations.
9. **Participant** (`/participant/portal`): Team member rosters, QR check-in badges, submission verification, live alerts.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router) with full static export (`output: 'export'`)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Client Networking**: Centralized API abstraction (`lib/api/config.ts`) resolving `NEXT_PUBLIC_API_BASE_URL` with automatic Bearer token injection and tenant isolation headers (`x-organization-id`).

### Backend
- **Framework**: FastAPI (standard packaging with `fastapi-cli` & `uvicorn`)
- **Language**: Python 3.11+
- **Validation**: Pydantic v2 schemas for all inputs and responses
- **ORM / Persistence**: SQLAlchemy 2.0 with connection pooling (`pool_pre_ping=True`)
- **Database Engine**:
  - **Production**: PostgreSQL 16 (Row-Level Security & tenant schema separation)
  - **Local Development / Fallback**: Resilient SQLite engine at `backend/data/eventops.db`
- **Constraint Optimization**: Google OR-Tools CP-SAT (Constraint Programming - Satisfiability v9.15)
- **Cryptography & Security**: PyJWT (HS256), `passlib` with bcrypt, HMAC-SHA256 for tamper-proof QR tokens
- **Real-Time Layer**: Authenticated WebSocket (`/ws`) connection manager with topic-based pub/sub broadcasting

---

## ☁️ FastAPI Cloud Deployment & Startup Configuration

### Root Cause of Previous Cloud Startup Failure

When deploying to FastAPI Cloud, deployment build logs repeatedly reported:
```
Starting FastAPI in production mode
Could not find a default file to run, please provide an explicit path
```

#### Diagnostic Breakdown:
1. **Default Detection Path**: The official FastAPI Cloud CLI executes `fastapi run` in the root of the repository. By default, `fastapi run` searches only the current working directory for files named `main.py`, `app.py`, `api.py`, or `app/main.py`.
2. **Repository Nesting**: The project backend was located exclusively in `backend/app/main.py`. Because no root `main.py` or entry point configuration was declared in the root `pyproject.toml`, the CLI exited immediately with code 1.
3. **Dependency Manifest**: FastAPI Cloud expects a root-level `requirements.txt` or `pyproject.toml` specifying `fastapi[standard]>=0.115.0`.

### Resolution & Verified Configuration

We established a production-grade entrypoint architecture matching FastAPI Cloud specifications:

1. **Root Application Forwarder (`main.py`)**:
   Exposes the canonical FastAPI `app` instance while ensuring `backend/` is added to Python's module search path:
   ```python
   import sys, os
   current_dir = os.path.dirname(os.path.abspath(__file__))
   backend_dir = os.path.join(current_dir, "backend")
   if backend_dir not in sys.path:
       sys.path.insert(0, backend_dir)

   from app.main import app  # Exposes canonical FastAPI app
   ```

2. **Root Entrypoint Configuration (`pyproject.toml`)**:
   Tells `fastapi run` exactly where to locate the application object:
   ```toml
   [tool.fastapi]
   entrypoint = "main:app"

   [build-system]
   requires = ["setuptools>=61.0"]
   build-backend = "setuptools.build_meta"
   ```

3. **Subdirectory Configuration (`backend/pyproject.toml`)**:
   Allows running `fastapi dev` or `fastapi run` directly from within the `backend/` directory:
   ```toml
   [tool.fastapi]
   entrypoint = "app.main:app"
   ```

4. **Root & Backend Dependency Manifests (`requirements.txt`)**:
   Pins all ASGI server, cloud CLI, cryptographic, and mathematical packages:
   ```txt
   fastapi[standard]>=0.115.0
   uvicorn[standard]>=0.30.0
   pydantic>=2.7.0
   pydantic-settings>=2.3.0
   sqlalchemy>=2.0.30
   psycopg2-binary>=2.9.9
   ortools>=9.10.4067
   python-jose[cryptography]>=3.3.0
   passlib[bcrypt]>=1.7.4
   python-multipart>=0.0.9
   websockets>=12.0
   email-validator>=2.2.0
   ```

### Verified Startup Commands

- **Production Mode (FastAPI Cloud Default)**:
  ```bash
  fastapi run
  ```
  *Startup Log Verification:*
  ```
  ⚡️ Starting FastAPI in production mode
  🐍 Using import string: main:app
  🌐 Server started at http://0.0.0.0:8000
     Documentation at http://0.0.0.0:8000/docs
  ```

- **Alternative Production ASGI Command**:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
  ```

- **Local Development with Hot-Reload**:
  ```bash
  fastapi dev
  # or
  uvicorn main:app --port 8000 --reload
  ```

---

## 🌐 GitHub Pages Frontend Static Export

GitHub Pages is a static file host that does not execute Node.js or Python runtime servers. The Next.js frontend has been modernized to compile into a zero-server static build (`./out`).

### Export Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Configure basePath if hosting under a repository subpath (e.g. /EVENTOPS-2026)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
```

### Static Dynamic Route Generation

Next.js static export requires all dynamic parameters (`[id]`) to declare their static routes at build time. We implemented `generateStaticParams()` across all 12 dynamic segments:

| Route Path | Params Generated | Purpose |
| :--- | :--- | :--- |
| `app/events/[eventId]/` | `evt-01`, `evt-vistera-2026` | Event dashboard & tracks |
| `app/incidents/[incidentId]/` | `inc-01`, `inc-02` | Incident triage reports |
| `app/judge/evaluation/[teamId]/` | `team-01`, `team-02`, `team-03` | Judge scoring forms |
| `app/judge/teams/[teamId]/` | `team-01`, `team-02`, `team-03` | Judge team profile review |
| `app/judges/[judgeId]/` | `jdg-01`, `jdg-02` | Judge credentials & bio |
| `app/organizations/[organizationId]/`| `org-01`, `org-vistera` | Tenant organization settings |
| `app/personal-events/[eventId]/` | `evt-01`, `evt-vistera-2026` | Participant personal agenda |
| `app/rounds/[roundId]/` | `rnd-01`, `rnd-02`, `rnd-03` | Track round progression |
| `app/super-admin/organizations/[id]/`| `org-01`, `org-vistera` | Super-admin tenant inspection|
| `app/teams/[teamId]/` | `team-01`, `team-02`, `team-03` | Team roster & submissions |
| `app/venues/[venueId]/` | `ven-01`, `ven-02` | Venue & bench allocations |
| `app/volunteers/[volunteerId]/` | `vol-01`, `vol-02` | Volunteer shifts & stations |

### Client-Side API Centralization (`lib/api/config.ts`)

All API requests dynamically resolve the FastAPI backend endpoint:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
```
When requests execute, stored JWT tokens (`localStorage.getItem('token')`) and tenant headers (`x-organization-id`) are automatically injected into standard Fetch headers.

---

## 🧮 Mathematical Optimization (Google OR-Tools CP-SAT)

EVENTOPS-2026 integrates the **Google OR-Tools CP-SAT** constraint programming engine (`backend/app/services/allocation_solver.py`) to resolve complex hackathon assignment problems in milliseconds.

### Optimization Objectives & Constraints Enforced:
1. **Capacity Constraints**: Each judge is assigned no more than `max_teams_per_judge` teams.
2. **Coverage Constraints**: Every team is evaluated by at least `min_judges_per_team` independent judges.
3. **Conflict of Interest Avoidance**: Strict binary constraints (`bool_var == 0`) prevent judges from evaluating teams from their affiliated organization or track.
4. **Workload Balancing**: Minimizes variance across judge allocations to prevent reviewer fatigue.
5. **Multi-Track Compatibility**: Aligns team project categories with judge domain expertise.

When allocations are requested via `POST /api/v1/allocation/optimize`, the CP-SAT solver proves optimality or reports feasibility within a strict timeout window.

---

## 🔒 Security, RBAC & Cryptographic QR Verification

### Zero-Trust Authentication
- Passwords hashed with industry-standard bcrypt via `passlib`.
- Cryptographic session tokens generated via PyJWT using HS256 with custom claims (`user_id`, `role`, `organization_id`).
- Role-based authorization dependencies (`require_roles([...])`) inspect tokens on every protected endpoint.

### Tamper-Proof Cryptographic QR Badges
Participant and volunteer QR badges are cryptographically signed using an HMAC-SHA256 signature scheme:
$$\text{Signature} = \text{HMAC-SHA256}_{K}(\text{participant\_id} \parallel \text{event\_id} \parallel \text{timestamp})$$
- Even if a badge is printed or cloned, modifying the participant ID or timestamps invalidates the cryptographic checksum.
- Scanners verify QR tokens on `POST /api/v1/attendance/verify-qr` with millisecond validation and offline fallback caching.

---

## 🚀 Local Quickstart & Execution Guide

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **Package Managers**: `pip` and `npm`

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/RAHUL-TKRCET/EVENTOPS-2026.git
cd EVENTOPS-2026

# Initialize Python virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows PowerShell:
.\backend\venv\Scripts\Activate.ps1
# macOS / Linux:
source backend/venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Seed the database with VISTERA 2026 initial dataset & 9 roles
python backend/database/seed.py

# Launch FastAPI backend in production mode (FastAPI Cloud standard)
fastapi run

# Or launch with hot-reload for development
fastapi dev
```
The backend API is now running at `http://127.0.0.1:8000`.

### 2. Frontend Setup

In a separate terminal window:
```bash
# Navigate to project root
cd EVENTOPS-2026

# Install Node dependencies
npm install

# Run Next.js in development mode
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Building Frontend for GitHub Pages Static Deployment

```bash
npm run build
```
The static HTML, JavaScript, and CSS bundle is compiled directly to `./out` (122 static HTML pages).

---

## 🧪 Automated Verification & Testing

### Backend Integration Test Suite
The repository includes comprehensive automated tests covering authentication, RBAC authorization, event lifecycle, and Google OR-Tools optimization:

```bash
# Run pytest test suite
pytest backend/tests/test_api.py -v
```

**Test Execution Results:**
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.4.2
rootdir: c:\Users\Harsha priya\OneDrive\Desktop\vistera2026_27\eventops-full-project\backend
collected 9 items

backend/tests/test_api.py::test_health_endpoint PASSED                   [ 11%]
backend/tests/test_api.py::test_auth_login_super_admin PASSED            [ 22%]
backend/tests/test_api.py::test_auth_invalid_credentials PASSED          [ 33%]
backend/tests/test_api.py::test_rbac_forbidden_access PASSED             [ 44%]
backend/tests/test_api.py::test_events_listing_and_creation PASSED       [ 55%]
backend/tests/test_api.py::test_teams_lifecycle PASSED                   [ 66%]
backend/tests/test_api.py::test_venues_and_benches PASSED                [ 77%]
backend/tests/test_api.py::test_qr_code_verification_hmac PASSED         [ 88%]
backend/tests/test_api.py::test_ortools_allocation_optimization PASSED   [100%]

============================== 9 passed in 5.42s ==============================
```

### Static Export Compilation Test
```bash
npm run build
```
- **Result**: Exit code `0`
- **Output**: 122 static pages generated into `./out`

---

## ⚙️ Environment Variables Reference

Copy `.env.example` to `.env` and configure accordingly:

```bash
cp .env.example .env
```

### Backend Environment Variables
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for ASGI server to bind |
| `NODE_ENV` | `production` | Deployment environment (`production` or `development`) |
| `DATABASE_URL` | None | PostgreSQL connection URI (`postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET` | System Generated | Secret key for signing HS256 session tokens (minimum 32 characters) |
| `QR_HMAC_SECRET` | System Generated | Cryptographic salt for participant HMAC-SHA256 QR codes |
| `CLIENT_ORIGIN` | `https://rahul-tkrcet.github.io` | Allowed CORS origin for frontend |
| `REDIS_URL` | `redis://localhost:6379` | Optional Redis broker for distributed cluster pub/sub |
| `AI_PROVIDER` | `mock` | Constraint parser integration (`mock`, `gemini`, or `openai`) |

### Frontend Environment Variables
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | URL pointing to the FastAPI backend API |
| `NEXT_PUBLIC_BASE_PATH` | `""` | Base path for GitHub Pages repository subdirectory |

---

## 📡 API Diagnostics & OpenAPI Documentation

When the FastAPI server is running, interactive API documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI JSON Spec**: [http://127.0.0.1:8000/api/v1/openapi.json](http://127.0.0.1:8000/api/v1/openapi.json)
- **Health Diagnostic Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Sample Health Check Response:
```json
{
  "status": "HEALTHY",
  "service": "EVENTOPS-2026 Core Backend",
  "version": "2.0.0",
  "environment": "production",
  "timestamp": "2026-10-09T13:37:37.721260+00:00",
  "uptimeSeconds": 445,
  "database": "ONLINE (External PostgreSQL 16)",
  "solvers": {
    "google_or_tools": "ACTIVE (CP-SAT v9.15)",
    "ai_constraint_engine": "ACTIVE"
  },
  "rbacRoles": "9 Roles Enforced"
}
```

---

## 👥 Contributors & Maintainers

- **Project Lead**: RAHUL-TKRCET & VISTERA 2026 Core Team
- **Repository**: [https://github.com/RAHUL-TKRCET/EVENTOPS-2026](https://github.com/RAHUL-TKRCET/EVENTOPS-2026)
- **License**: MIT
