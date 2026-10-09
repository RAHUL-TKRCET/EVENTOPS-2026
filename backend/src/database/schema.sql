-- ============================================================================
-- EVENTOPS 2026 — PostgreSQL Relational Schema & Multi-Tenant Architecture
-- Universal SaaS (Organization Mode) & Independent Events (Personal Mode)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    subtype VARCHAR(64),
    description TEXT,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    size VARCHAR(64) DEFAULT 'Medium (50-250)',
    logo VARCHAR(255),
    owner_id VARCHAR(64),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    plan VARCHAR(32) DEFAULT 'Starter' CHECK (plan IN ('Free', 'Starter', 'Enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users & Credentials
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(32) NOT NULL CHECK (role IN (
        'SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'EVENT_ADMIN',
        'COORDINATOR', 'JUDGE', 'VOLUNTEER',
        'PARTICIPANT', 'TECHNICAL_STAFF', 'RESOURCE_MANAGER'
    )),
    avatar_url VARCHAR(500),
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Organization Memberships (Multi-Tenant RBAC)
CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'INVITED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

-- 4. Events (Dual Mode: Tenant-bound or Personal)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    is_personal_event BOOLEAN DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    banner_url VARCHAR(500),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UPCOMING', 'LIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
    expected_participants INT DEFAULT 100,
    current_round INT DEFAULT 1,
    total_rounds INT DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rounds & Evaluation Stages
CREATE TABLE IF NOT EXISTS rounds (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    round_order INT NOT NULL,
    status VARCHAR(32) DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'IN_PROGRESS', 'EVALUATING', 'COMPLETED')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    qualifying_quota INT DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Round Evaluation Criteria (Rubrics)
CREATE TABLE IF NOT EXISTS round_criteria (
    id VARCHAR(64) PRIMARY KEY,
    round_id VARCHAR(64) NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 25.0,
    weight NUMERIC(4,3) DEFAULT 0.25,
    description TEXT
);

-- 7. Time Slots
CREATE TABLE IF NOT EXISTS time_slots (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id VARCHAR(64) REFERENCES rounds(id) ON DELETE SET NULL,
    label VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT DEFAULT 30
);

-- 8. Event Rules
CREATE TABLE IF NOT EXISTS event_rules (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(32) CHECK (category IN ('ELIGIBILITY', 'SUBMISSION', 'EVALUATION', 'CODE_OF_CONDUCT', 'HARDWARE')),
    is_mandatory BOOLEAN DEFAULT TRUE
);

-- 9. Venues & Halls
CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    has_power BOOLEAN DEFAULT TRUE,
    has_internet BOOLEAN DEFAULT TRUE,
    is_accessible BOOLEAN DEFAULT TRUE,
    equipment JSONB DEFAULT '[]'::jsonb,
    supported_domains JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULL', 'STANDBY', 'MAINTENANCE'))
);

-- 10. Benches & Seating Positions
CREATE TABLE IF NOT EXISTS benches (
    id VARCHAR(64) PRIMARY KEY,
    venue_id VARCHAR(64) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    status VARCHAR(32) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    has_power BOOLEAN DEFAULT TRUE,
    has_ethernet BOOLEAN DEFAULT TRUE,
    assigned_team_id VARCHAR(64)
);

-- 11. Teams & Registrations
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    lead_name VARCHAR(255) NOT NULL,
    lead_email VARCHAR(255) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    project_abstract TEXT,
    project_domain VARCHAR(100) NOT NULL,
    repo_url VARCHAR(500),
    demo_url VARCHAR(500),
    tech_stack JSONB DEFAULT '[]'::jsonb,
    hardware_requirements JSONB DEFAULT '[]'::jsonb,
    registration_status VARCHAR(32) DEFAULT 'APPROVED' CHECK (registration_status IN ('APPROVED', 'PENDING', 'REJECTED')),
    check_in_status VARCHAR(32) DEFAULT 'NOT_CHECKED_IN' CHECK (check_in_status IN ('CHECKED_IN', 'NOT_CHECKED_IN', 'PARTIAL', 'ABSENT')),
    checked_in_time TIMESTAMP WITH TIME ZONE,
    assigned_venue_id VARCHAR(64) REFERENCES venues(id) ON DELETE SET NULL,
    assigned_bench_id VARCHAR(64) REFERENCES benches(id) ON DELETE SET NULL,
    assigned_judges JSONB DEFAULT '[]'::jsonb,
    current_round INT DEFAULT 1,
    total_score NUMERIC(6,2) DEFAULT 0.0,
    rank INT,
    qr_code_token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(32) DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'MEMBER')),
    organization_or_school VARCHAR(255),
    dietary_preference VARCHAR(32) DEFAULT 'VEG' CHECK (dietary_preference IN ('VEG', 'NON_VEG', 'JAIN', 'VEGAN')),
    tshirt_size VARCHAR(16) DEFAULT 'L' CHECK (tshirt_size IN ('S', 'M', 'L', 'XL', 'XXL')),
    check_in_status VARCHAR(32) DEFAULT 'ABSENT' CHECK (check_in_status IN ('CHECKED_IN', 'ABSENT')),
    checked_in_at TIMESTAMP WITH TIME ZONE
);

-- 13. Judges Panel & Domain Pairing
CREATE TABLE IF NOT EXISTS judges (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    title VARCHAR(255),
    domains JSONB DEFAULT '[]'::jsonb,
    assigned_teams JSONB DEFAULT '[]'::jsonb,
    workload_status VARCHAR(32) DEFAULT 'AVAILABLE' CHECK (workload_status IN ('AVAILABLE', 'BUSY', 'OVERLOADED', 'UNAVAILABLE')),
    max_teams INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Evaluations & Scorecards
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id VARCHAR(64) NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    judge_id VARCHAR(64) NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    scores JSONB NOT NULL,
    total_score NUMERIC(6,2) NOT NULL,
    feedback TEXT,
    strengths TEXT,
    areas_to_improve TEXT,
    status VARCHAR(32) DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, judge_id, team_id)
);

-- 15. Attendance Audit & Hardware Scans
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    member_id VARCHAR(64) REFERENCES team_members(id) ON DELETE SET NULL,
    scanned_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info VARCHAR(255),
    verification_status VARCHAR(32) DEFAULT 'VERIFIED',
    bench_confirmed VARCHAR(64)
);

-- 16. Allocation Constraints & Optimization Solvers
CREATE TABLE IF NOT EXISTS allocation_constraints (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    constraint_type VARCHAR(16) NOT NULL CHECK (constraint_type IN ('HARD', 'SOFT')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    weight NUMERIC(4,2) DEFAULT 1.0,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS allocation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_id VARCHAR(64) REFERENCES rounds(id) ON DELETE CASCADE,
    allocation_matrix JSONB NOT NULL,
    satisfaction_score NUMERIC(5,2),
    solver_status VARCHAR(64) DEFAULT 'OPTIMAL',
    execution_time_ms INT,
    solved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Volunteers & Floor Shifts
CREATE TABLE IF NOT EXISTS volunteers (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_BREAK', 'OFF_DUTY')),
    current_task VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS volunteer_tasks (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    volunteer_id VARCHAR(64) REFERENCES volunteers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    zone VARCHAR(100),
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    due_time TIMESTAMP WITH TIME ZONE
);

-- 18. Logistics, Swag & Meal Resources
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL CHECK (category IN ('BADGES', 'KITS', 'MEALS', 'EQUIPMENT', 'MERCH')),
    item_name VARCHAR(255) NOT NULL,
    total_quantity INT NOT NULL,
    distributed_quantity INT DEFAULT 0,
    unit VARCHAR(32) DEFAULT 'units'
);

CREATE TABLE IF NOT EXISTS resource_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    team_id VARCHAR(64) REFERENCES teams(id) ON DELETE SET NULL,
    member_id VARCHAR(64) REFERENCES team_members(id) ON DELETE SET NULL,
    distributed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Incidents & Dispatch
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(32) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    location VARCHAR(255) NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 20. Platform Security Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id VARCHAR(64),
    event_id VARCHAR(64),
    user_id VARCHAR(64),
    user_role VARCHAR(32),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Indexes for Low-Latency Query Execution
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_event ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_benches_venue ON benches(venue_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_round_team ON evaluations(round_id, team_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_incidents_event ON incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_id);
