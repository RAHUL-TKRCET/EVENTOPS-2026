-- ============================================================================
-- EVENTOPS 2026 — Initial Seed Data for Designated Modules
-- ============================================================================

-- 1. Insert Default Organization
INSERT INTO organizations (id, name, type, subtype, country, city, website, size, plan)
VALUES (
    'org-01',
    'VISTERA Engineering Academy',
    'Educational Institution',
    'College',
    'India',
    'Hyderabad',
    'https://vistera2026.edu',
    'Large (250-1000)',
    'Enterprise'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users for All 9 Roles (Password: admin123 / participant123)
-- bcrypt hash for admin123: $2a$10$9zP1W73JmHsk7b6YQvF07e9rIu1uR68O3P6sQy4oM2R.7x9g.1s2q
-- bcrypt hash for participant123: $2a$10$8wT1X84KnItl8c7ZRxG18f0sJv2vS79P4Q7tRz5pN3S.8y0h.2t3r
INSERT INTO users (id, name, email, password_hash, role, organization_id)
VALUES
    ('usr-super', 'Alexander Sterling', 'superadmin@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SUPER_ADMIN', 'org-01'),
    ('usr-org', 'Dean Sarah Jenkins', 'orgadmin@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ORGANIZATION_ADMIN', 'org-01'),
    ('usr-event', 'Vikramaditya Roy', 'eventadmin@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EVENT_ADMIN', 'org-01'),
    ('usr-coord', 'Elena Rostova', 'coordinator@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COORDINATOR', 'org-01'),
    ('J001', 'Dr. Marcus Vance', 'marcus.vance@mit.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'JUDGE', 'org-01'),
    ('vol-01', 'Priya Nair', 'volunteer@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'VOLUNTEER', 'org-01'),
    ('part-01', 'Aarav Sharma', 'aarav.sharma@tkrcet.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'PARTICIPANT', 'org-01'),
    ('tech-01', 'Karthik Raja', 'techstaff@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TECHNICAL_STAFF', 'org-01'),
    ('res-01', 'Sneha Reddy', 'resourcemanager@eventops.demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'RESOURCE_MANAGER', 'org-01')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Flagship Event
INSERT INTO events (id, organization_id, owner_id, is_personal_event, name, type, description, location, start_date, end_date, registration_deadline, status, expected_participants, current_round, total_rounds)
VALUES (
    'evt-01',
    'org-01',
    'usr-event',
    FALSE,
    'VISTERA 2026 — Flagship National Hackathon',
    'Hackathon',
    'National-level 36-hour hackathon focusing on AI systems, robotics, and distributed architectures.',
    'Main Campus Engineering Block, Hall 1-4',
    '2026-10-15 09:00:00+00',
    '2026-10-17 18:00:00+00',
    '2026-10-12 23:59:59+00',
    'LIVE',
    120,
    1,
    3
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Rounds & Criteria
INSERT INTO rounds (id, event_id, name, round_order, status, start_time, end_time, qualifying_quota)
VALUES
    ('rnd-01', 'evt-01', 'Round 1 — Preliminary Architecture Pitch', 1, 'IN_PROGRESS', '2026-10-15 14:00:00+00', '2026-10-15 18:00:00+00', 30),
    ('rnd-02', 'evt-01', 'Round 2 — Deep Technical Audit', 2, 'UPCOMING', '2026-10-16 10:00:00+00', '2026-10-16 14:00:00+00', 10),
    ('rnd-03', 'evt-01', 'Grand Finale — Jury Defense', 3, 'UPCOMING', '2026-10-17 11:00:00+00', '2026-10-17 16:00:00+00', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO round_criteria (id, round_id, name, max_score, weight, description)
VALUES
    ('c1', 'rnd-01', 'Technical Feasibility', 25.0, 0.25, 'System architecture and execution viability'),
    ('c2', 'rnd-01', 'Innovation & Originality', 25.0, 0.25, 'Novelty of approach'),
    ('c3', 'rnd-01', 'Implementation Completeness', 25.0, 0.25, 'Code quality and working demo'),
    ('c4', 'rnd-01', 'Impact & Presentation', 25.0, 0.25, 'Clarity of pitch and real-world value')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Venues and Benches
INSERT INTO venues (id, event_id, name, building, floor, capacity, has_power, has_internet, is_accessible, status)
VALUES
    ('R001', 'evt-01', 'Turing Computing Lab 101', 'Engineering Block A', '1st Floor', 40, TRUE, TRUE, TRUE, 'ACTIVE'),
    ('R002', 'evt-01', 'Ada Lovelace Hardware Studio', 'Engineering Block B', 'Ground Floor', 35, TRUE, TRUE, TRUE, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO benches (id, venue_id, label, status, has_power, has_ethernet, assigned_team_id)
VALUES
    ('B001', 'R001', 'Bench A-01', 'available', TRUE, TRUE, NULL),
    ('B002', 'R001', 'Bench A-02', 'available', TRUE, TRUE, NULL),
    ('B003', 'R001', 'Bench A-03', 'available', TRUE, TRUE, NULL),
    ('B004', 'R001', 'Bench A-04', 'occupied', TRUE, TRUE, 'T001'),
    ('B005', 'R001', 'Bench A-05', 'occupied', TRUE, TRUE, 'T002')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Teams
INSERT INTO teams (id, event_id, name, lead_name, lead_email, project_title, project_abstract, project_domain, repo_url, registration_status, check_in_status, checked_in_time, assigned_venue_id, assigned_bench_id, current_round, total_score, qr_code_token)
VALUES
    ('T001', 'evt-01', 'NeuralPulse Labs', 'Aarav Sharma', 'aarav.sharma@tkrcet.ac.in', 'BioTelemetry Edge: Low-Latency EEG Streamer', 'Ultra-low power wearable biosignal classifier running quantization models on edge ESP32 microcontrollers.', 'HealthTech & Bio', 'https://github.com/neuralpulse/biotelemetry', 'APPROVED', 'CHECKED_IN', '2026-10-15 09:15:00+00', 'R001', 'B004', 1, 84.50, 'EO-PASS-T001-TOKEN-CRYPT-2026'),
    ('T002', 'evt-01', 'QuantumSentinel', 'Devika Menon', 'devika.m@iitb.ac.in', 'Post-Quantum Mesh Encryption Daemon', 'Kyber-based zero-trust encrypted mesh radio communication for disaster relief command channels.', 'CyberSecurity', 'https://github.com/quantumsentinel/core', 'APPROVED', 'CHECKED_IN', '2026-10-15 09:30:00+00', 'R001', 'B005', 1, 79.00, 'EO-PASS-T002-TOKEN-CRYPT-2026')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Judges
INSERT INTO judges (id, event_id, user_id, name, email, organization, title, domains, workload_status, max_teams)
VALUES
    ('J001', 'evt-01', 'J001', 'Dr. Marcus Vance', 'marcus.vance@mit.edu', 'MIT Media Lab', 'Principal Research Scientist', '["AI / Machine Learning", "HealthTech & Bio"]'::jsonb, 'AVAILABLE', 12),
    ('J002', 'evt-01', NULL, 'Dr. Rachel Chen', 'rachel.chen@stanford.edu', 'Stanford Security Lab', 'Associate Professor', '["CyberSecurity", "Distributed Systems / Web3"]'::jsonb, 'AVAILABLE', 12)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Logistics Resources
INSERT INTO resources (id, event_id, category, item_name, total_quantity, distributed_quantity, unit)
VALUES
    ('res-1', 'evt-01', 'BADGES', 'NFC / QR Holographic Badges', 500, 384, 'badges'),
    ('res-2', 'evt-01', 'KITS', 'VISTERA 2026 Welcome Kits (Backpack & T-Shirt)', 500, 372, 'kits'),
    ('res-3', 'evt-01', 'MEALS', 'Day 1 Dinner Meal Coupons', 500, 410, 'coupons'),
    ('res-4', 'evt-01', 'EQUIPMENT', 'ESP32-S3 AI Development Boards', 50, 28, 'boards')
ON CONFLICT (id) DO NOTHING;

