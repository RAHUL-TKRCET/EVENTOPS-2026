import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(64), nullable=False)
    subtype = Column(String(64), nullable=True)
    description = Column(Text, nullable=True)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    size = Column(String(64), default="Medium (50-250)")
    logo = Column(String(255), nullable=True)
    owner_id = Column(String(64), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    plan = Column(String(32), default="Starter")
    created_at = Column(DateTime(timezone=True), default=utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(32), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    organization_id = Column(String(64), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(32), nullable=False)
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(String(64), primary_key=True)
    organization_id = Column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    owner_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_personal_event = Column(Boolean, default=False)
    name = Column(String(255), nullable=False)
    type = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    banner_url = Column(String(500), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(32), default="DRAFT")
    expected_participants = Column(Integer, default=100)
    current_round = Column(Integer, default=1)
    total_rounds = Column(Integer, default=2)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class EventMember(Base):
    __tablename__ = "event_members"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False)
    phone = Column(String(50), nullable=True)
    title = Column(String(100), nullable=True)
    zone_or_dept = Column(String(100), nullable=True)
    status = Column(String(32), default="ACTIVE")
    added_by = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Round(Base):
    __tablename__ = "rounds"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    round_order = Column(Integer, nullable=False)
    status = Column(String(32), default="UPCOMING")
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    qualifying_quota = Column(Integer, default=20)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class RoundCriterion(Base):
    __tablename__ = "round_criteria"

    id = Column(String(64), primary_key=True)
    round_id = Column(String(64), ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    max_score = Column(Float, default=25.0)
    weight = Column(Float, default=0.25)
    description = Column(Text, nullable=True)


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(String(64), ForeignKey("rounds.id", ondelete="SET NULL"), nullable=True)
    label = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, default=30)


class EventRule(Base):
    __tablename__ = "event_rules"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(32), default="ELIGIBILITY")
    is_mandatory = Column(Boolean, default=True)


class Venue(Base):
    __tablename__ = "venues"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    has_power = Column(Boolean, default=True)
    has_internet = Column(Boolean, default=True)
    is_accessible = Column(Boolean, default=True)
    equipment = Column(JSON, default=list)
    supported_domains = Column(JSON, default=list)
    status = Column(String(32), default="ACTIVE")


class Bench(Base):
    __tablename__ = "benches"

    id = Column(String(64), primary_key=True)
    venue_id = Column(String(64), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(100), nullable=False)
    status = Column(String(32), default="available")
    has_power = Column(Boolean, default=True)
    has_ethernet = Column(Boolean, default=True)
    assigned_team_id = Column(String(64), nullable=True)


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    lead_name = Column(String(255), nullable=False)
    lead_email = Column(String(255), nullable=False)
    project_title = Column(String(255), nullable=False)
    project_abstract = Column(Text, nullable=True)
    project_domain = Column(String(100), nullable=False)
    repo_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    tech_stack = Column(JSON, default=list)
    hardware_requirements = Column(JSON, default=list)
    registration_status = Column(String(32), default="APPROVED")
    check_in_status = Column(String(32), default="NOT_CHECKED_IN")
    checked_in_time = Column(DateTime(timezone=True), nullable=True)
    assigned_venue_id = Column(String(64), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True)
    assigned_bench_id = Column(String(64), ForeignKey("benches.id", ondelete="SET NULL"), nullable=True)
    assigned_judges = Column(JSON, default=list)
    current_round = Column(Integer, default=1)
    total_score = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    qr_code_token = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(64), primary_key=True)
    team_id = Column(String(64), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(32), default="MEMBER")
    organization_or_school = Column(String(255), nullable=True)
    dietary_preference = Column(String(32), default="VEG")
    tshirt_size = Column(String(16), default="L")
    check_in_status = Column(String(32), default="ABSENT")
    checked_in_at = Column(DateTime(timezone=True), nullable=True)


class Judge(Base):
    __tablename__ = "judges"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=True)
    title = Column(String(255), nullable=True)
    domains = Column(JSON, default=list)
    assigned_teams = Column(JSON, default=list)
    workload_status = Column(String(32), default="AVAILABLE")
    max_teams = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(String(64), ForeignKey("rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    judge_id = Column(String(64), ForeignKey("judges.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(64), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    scores = Column(JSON, nullable=False)
    total_score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    areas_to_improve = Column(Text, nullable=True)
    status = Column(String(32), default="SUBMITTED")
    submitted_at = Column(DateTime(timezone=True), default=utcnow)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(String(64), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String(64), ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    scanned_by_user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    scan_timestamp = Column(DateTime(timezone=True), default=utcnow)
    device_info = Column(String(255), nullable=True)
    verification_status = Column(String(32), default="VERIFIED")
    bench_confirmed = Column(String(64), nullable=True)


class AllocationConstraint(Base):
    __tablename__ = "allocation_constraints"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    constraint_type = Column(String(16), nullable=False)  # 'HARD' or 'SOFT'
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parameters = Column(JSON, default=dict)
    weight = Column(Float, default=1.0)
    enabled = Column(Boolean, default=True)


class AllocationResult(Base):
    __tablename__ = "allocation_results"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id = Column(String(64), ForeignKey("rounds.id", ondelete="CASCADE"), nullable=True)
    allocation_matrix = Column(JSON, nullable=False)
    satisfaction_score = Column(Float, nullable=True)
    solver_status = Column(String(64), default="OPTIMAL")
    execution_time_ms = Column(Integer, nullable=True)
    solved_at = Column(DateTime(timezone=True), default=utcnow)


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(100), nullable=False)
    zone = Column(String(100), nullable=False)
    status = Column(String(32), default="ACTIVE")
    current_task = Column(String(255), nullable=True)


class VolunteerTask(Base):
    __tablename__ = "volunteer_tasks"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    volunteer_id = Column(String(64), ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    zone = Column(String(100), nullable=True)
    status = Column(String(32), default="PENDING")
    due_time = Column(DateTime(timezone=True), nullable=True)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(64), nullable=False)
    item_name = Column(String(255), nullable=False)
    total_quantity = Column(Integer, nullable=False)
    distributed_quantity = Column(Integer, default=0)
    unit = Column(String(32), default="units")


class ResourceDistribution(Base):
    __tablename__ = "resource_distributions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(64), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(64), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    member_id = Column(String(64), ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    distributed_by = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    distributed_at = Column(DateTime(timezone=True), default=utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True)
    event_id = Column(String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)
    severity = Column(String(16), nullable=False)
    status = Column(String(32), default="OPEN")
    location = Column(String(255), nullable=False)
    reported_by = Column(String(255), nullable=False)
    assigned_to = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    reported_at = Column(DateTime(timezone=True), default=utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(64), nullable=True)
    event_id = Column(String(64), nullable=True, index=True)
    user_id = Column(String(64), nullable=True)
    user_role = Column(String(32), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    metadata_json = Column("metadata", JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

