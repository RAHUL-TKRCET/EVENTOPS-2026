# EVENTOPS — Comprehensive System Architecture Document

**Platform:** AI-Powered Event Operations & Management Platform  
**Tagline:** *Run the event, not the paperwork.*  
**Author/Team:** Panch Pandavs  
**Version:** 2.0.0 (Universal Multi-Tenant SaaS & Personal Events)  
**Status:** Architecture Specification & Frontend Implementation Guide  

---

## 1. Executive Summary & Product Vision

**EVENTOPS** is a universal, multi-tenant Event Operations SaaS platform built to automate and coordinate mission-critical event logistics. While hackathons and collegiate tech symposiums serve as baseline verification scenarios, EVENTOPS is designed to support:

* **Educational Institutions:** Colleges, Universities, Schools, Training Centers
* **Commercial Enterprises:** Startups, Tech Companies, Corporate Retreats, Event Agencies
* **Civic & Non-Profit Organizations:** NGOs, Community Groups, Professional Associations
* **Independent Organizers:** Freelance educators, meetup founders, and workshop conveners

### Core Architectural Axioms
1. **Zero Paperwork:** Every desk check-in, scoring rubric, room assignment, kit handoff, and incident alert is digitized and validated via cryptographic QR codes.
2. **Strict RBAC & Tenant Isolation:** User interfaces, available actions, and data views are enforced via granular Role-Based Access Control at both the routing and component guard levels.
3. **Dual Workspace Paradigm:** Full multi-tenant Organization Mode alongside unconstrained, lightweight Personal Event Mode.
4. **Optimization Ready:** Frontend contracts and state layers are architected for plug-and-play integration with Python FastAPI, PostgreSQL RLS, and Google OR-Tools CP-SAT constraint solvers.

---

## 2. High-Level System Architecture

EVENTOPS operates on a modern 3-tier cloud architecture with real-time reactive clients, an API abstraction gateway, and an asynchronous optimization engine.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Layer (Next.js 16 + React 19)"]
        UI["Web Application (Tailwind + Lucide)"]
        State["Zustand Store (Workspace & Role State)"]
        Guard["Route & Action RBAC Guard"]
        APIClient["API Abstraction Client (lib/api/*)"]
        UI --> State
        UI --> Guard
        Guard --> APIClient
    end

    subgraph APILayer["API Gateway & Service Layer (Target Architecture)"]
        Gateway["FastAPI Gateway / Reverse Proxy"]
        AuthSvc["Auth & Tenant Service (JWT / OTP)"]
        EventSvc["Event Operations Service"]
        RealtimeSvc["WebSocket / SSE PubSub Engine"]
        Gateway --> AuthSvc
        Gateway --> EventSvc
        Gateway --> RealtimeSvc
    end

    subgraph OptimizationLayer["AI & Constraint Solving Engine"]
        LLM["LLM Constraint Extractor"]
        Builder["Structured Constraint Builder"]
        CPSolver["Google OR-Tools CP-SAT Engine"]
        LLM --> Builder
        Builder --> CPSolver
    end

    subgraph StorageLayer["Data & Persistence Layer"]
        DB[("PostgreSQL Multi-Tenant (RLS)")]
        RedisCache[("Redis Cache & Broadcast Broker")]
    end

    APIClient --> Gateway
    EventSvc --> DB
    AuthSvc --> DB
    RealtimeSvc --> RedisCache
    EventSvc --> LLM
    CPSolver --> EventSvc
```

---

## 3. Dual Workspace Architecture: Organization vs. Personal Mode

A fundamental capability of EVENTOPS is allowing users to operate within formal corporate/institutional hierarchies or run independent, one-off events without creating dummy organizations.

```mermaid
flowchart TD
    User["Authenticated User Account"]
    User --> ModeCheck{"Select Workspace Mode"}
    
    ModeCheck -->|"Enterprise / Multi-Tenant"| OrgMode["Organization Mode"]
    ModeCheck -->|"Independent / Zero Setup"| PersonalMode["Personal Event Mode"]

    subgraph OrganizationWorkspace["Organization Mode Hierarchy"]
        OrgMode --> OrgNode["Organization (Tenant)"]
        OrgNode --> OrgEvents["Organization Events"]
        OrgEvents --> OrgOps["Role-Based Operations (Judges, Scanner Desks, Staff)"]
    end

    subgraph PersonalWorkspace["Personal Event Mode Hierarchy"]
        PersonalMode --> PersonalEvents["Personal Events (organizationId: null)"]
        PersonalEvents --> PersonalOps["Autonomous Operations (QR Badges, Evaluations)"]
    end
```

### Workspace Context Data Model
```typescript
// Organization Workspace Context
interface OrganizationEvent {
  id: string;
  organizationId: string; // Bound to tenant ID
  ownerId: string;
  isPersonalEvent: false;
}

// Personal Event Context
interface PersonalEvent {
  id: string;
  organizationId: null;   // Explicitly null - no fake tenant
  ownerId: string;        // Owned directly by user
  isPersonalEvent: true;
}
```

---

## 4. Role-Based Access Control (RBAC) Architecture

### 4.1. Role Matrix
The platform implements 9 dedicated roles. Access is never inherited through hierarchy; every role receives an explicit permission footprint.

| Role | Target Persona | Accessible Modules | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | Platform Owners | Entire Platform | Multi-tenant governance, system health, tenant provisioning |
| **ORGANIZATION_ADMIN** | Dean, VP, Executive | Organization Dashboard | Multi-event oversight, billing, staff invitations, organization settings |
| **EVENT_ADMIN** | Ops Director | Event Dashboard | Round scheduling, room planning, OR-Tools execution, team approvals |
| **COORDINATOR** | Floor Lead | Floor / Live Ops | Scanner desks, attendance tracking, rapid incident escalation |
| **JUDGE** | Evaluator, Jury | Judge Portal | Assigned team scoring, rubric evaluation, live progress tracking |
| **VOLUNTEER** | Student volunteer | Volunteer Portal | Zone shifts, task checklist, QR badge validation |
| **PARTICIPANT** | Attendee, Student | Participant Portal | Digital QR pass, team roster, schedule, live rankings |
| **TECHNICAL_STAFF** | NetOps, AV Tech | Technical Staff Portal | Power readiness, networking, hardware inspection, AV rooms |
| **RESOURCE_MANAGER** | Catering, Swag lead | Resource Portal | Kit distribution, meal scanning, merchandise inventory |

### 4.2. Role Hierarchy & Assignment Flow
Privileged roles cannot be selected by self-registration. They require authorization via cryptographic invitation codes.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Event / Org Admin
    participant System as EVENTOPS Backend
    actor Judge as Invited Judge
    
    Admin->>System: Enter Name, Email, Expertise, Track
    Admin->>System: Generate Invitation (Role = JUDGE, Token = INV-JURY-2026)
    System-->>Admin: Cryptographic Invite Created
    Admin->>Judge: Send Link / Code (INV-JURY-2026)
    Judge->>System: Access /organizations/join with code
    System->>System: Validate Token, Organization & Bound Role
    System-->>Judge: Display Verified Organization & Role Preview
    Judge->>System: Confirm & Accept Membership
    System->>System: Enforce Role = JUDGE (No privilege elevation allowed)
    System-->>Judge: Redirect to /judge (Dedicated Jury Portal)
```

---

## 5. Frontend Architecture & Directory Structure

Built using **Next.js 16 (Turbopack)**, **React 19**, **Tailwind CSS**, and **Zustand**.

```text
eventops/
├── app/                                 # Next.js App Router
│   ├── (auth)/                          # Public auth routes (login, register, forgot-password)
│   ├── workspace/                       # Workspace Selection Hub
│   ├── organizations/                   # Create & Join organization flows
│   ├── personal-events/                 # Personal events hub & standalone event creation
│   ├── dashboard/                       # Executive & Event Operations Dashboard
│   ├── control-center/                  # Live telemetry & incident overview
│   ├── events/                          # Event creation, settings, criteria, timeslots
│   ├── teams/                           # Team management, member rosters, projects
│   ├── attendance/                      # Check-in registry & Camera QR Scanner
│   ├── venues/                          # Venue blueprints, rooms & bench layouts
│   ├── judges/                          # Jury panel management & domain pairing
│   ├── allocation/                      # AI Constraint Builder & OR-Tools Solver view
│   ├── rounds/                          # Round progression & live leaderboards
│   ├── volunteers/                      # Shift schedules & task distribution
│   ├── resources/                       # Inventory, meals & badge logistics
│   ├── incidents/                       # Escalation log & priority dispatch
│   ├── communication/                   # Broadcast notifications & alerts
│   ├── ai-assistant/                    # Natural language operations copilot
│   ├── super-admin/                     # Platform-wide governance portal
│   ├── judge/                           # Evaluator scoring portal
│   ├── participant/                     # Student / attendee portal
│   ├── technical-staff/                 # Facilities & hardware portal
│   └── resource-manager/                # Asset & meal handoff portal
├── components/
│   ├── layout/                          # AppShell, Topbar, Sidebar
│   └── ui/                              # OrganizationSwitcher, RoleSwitcher, QRCard, KPICard, RoomMap
├── lib/
│   ├── api/                             # API service clients (auth, events, allocation, ai, etc.)
│   ├── mock-data/                       # Realistic multi-tenant and personal event fixtures
│   ├── permissions.ts                   # Route-level RBAC access checker
│   └── utils.ts                         # Formatting and style utilities
├── store/
│   └── index.ts                         # Zustand global state (Workspace, Role, User, Active Event)
└── types/
    └── index.ts                         # Universal TypeScript interfaces and schemas
```

### Route-Level RBAC Protection Flow
```mermaid
flowchart TD
    Req["Incoming Route Navigation (e.g. /control-center)"]
    Guard["checkRouteAccess(role, pathname) in lib/permissions.ts"]
    Req --> Guard
    Guard --> Check{"Is Role in Allowed List?"}
    Check -->|"Yes"| Allow["Render Target View"]
    Check -->|"No"| Deny["Render AccessDenied Component & Redirect"]
```

---

## 6. End-to-End Operational Workflows

### 6.1. Attendee Check-In & Bench Allocation Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Attendee as Participant
    actor Staff as Scanner Desk Volunteer
    participant Scanner as Camera QR Scanner (/attendance/scanner)
    participant Core as Attendance Engine
    participant Alloc as Venue Allocation System

    Attendee->>Staff: Presents Digital QR Badge (/participant/qr)
    Staff->>Scanner: Scans QR code with device camera
    Scanner->>Core: Verify cryptographic signature & team status
    Core->>Alloc: Check assigned bench / room
    Alloc-->>Core: Bench B-04 in Lab 301 Confirmed
    Core-->>Scanner: Display Success & Badge Verified
    Core->>Attendee: Update Realtime Status to "PRESENT"
```

### 6.2. AI Constraint & OR-Tools Optimization Pipeline
```mermaid
flowchart LR
    Prompt["Organizer Input:\n'Allocate 120 AI teams across 4 labs with 20 judges without domain bias'"]
    LLM["LLM Parser (lib/api/ai.ts)"]
    Constraints["Structured Constraint Set:\n- Room Capacity <= 40\n- Judge Expertise Match >= 80%\n- No Judge from Same Org"]
    Solver["OR-Tools CP-SAT Solver (lib/api/allocation.ts)"]
    Results["Optimal Allocation Matrix:\n- Teams to Benches\n- Judges to Evaluation Slots"]

    Prompt --> LLM
    LLM --> Constraints
    Constraints --> Solver
    Solver --> Results
```

---

## 7. Data Models & Entity Relationship

```mermaid
erDiagram
    ORGANIZATION ||--o{ ORGANIZATION_MEMBERSHIP : has
    ORGANIZATION ||--o{ EVENT : hosts
    USER ||--o{ ORGANIZATION_MEMBERSHIP : belongs_to
    USER ||--o{ EVENT : creates_personal
    EVENT ||--o{ ROUND : divides_into
    EVENT ||--o{ VENUE : contains
    EVENT ||--o{ TEAM : registers
    TEAM ||--o{ PARTICIPANT_MEMBER : includes
    ROUND ||--o{ EVALUATION_SCORE : assessed_by
    USER ||--o{ EVALUATION_SCORE : judges
    EVENT ||--o{ INCIDENT : reports
    VENUE ||--o{ BENCH : allocates

    ORGANIZATION {
        string id PK
        string name
        string type
        string subtype
        string plan
    }

    EVENT {
        string id PK
        string organizationId FK "Nullable for Personal Events"
        string ownerId FK
        boolean isPersonalEvent
        string name
        string status
        datetime startDate
    }

    USER {
        string id PK
        string name
        string email
        string role
    }

    TEAM {
        string id PK
        string eventId FK
        string name
        string status
        int benchNumber
    }
```

---

## 8. Extensibility & Future Backend Integration

The frontend is built with complete API decouplings. Replacing mock implementations with production microservices requires modifying only the `lib/api/*` directory:

1. **FastAPI Endpoints:** `lib/api/events.ts`, `lib/api/auth.ts`, `lib/api/allocation.ts` are 100% async and mirror FastAPI route conventions.
2. **PostgreSQL Relational Schema:** Tables for tenants, memberships, events, and allocations map directly to the interfaces in `types/index.ts`.
3. **WebSockets:** `lib/websocket/index.ts` provides a structured subscribe/publish interface for bidirectional real-time telemetry.
4. **CP-SAT Integration:** The constraint payload schema sent by `lib/api/allocation.ts` directly satisfies Google OR-Tools Python solver bindings.
