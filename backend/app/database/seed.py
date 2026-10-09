import sys
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, generate_qr_token
from app.models.entities import (
    Organization,
    User,
    OrganizationMembership,
    Event,
    EventMember,
    Round,
    RoundCriterion,
    TimeSlot,
    EventRule,
    Venue,
    Bench,
    Team,
    TeamMember,
    Judge,
    Resource,
    Incident,
)


def seed_database():
    """Seed persistent database with complete enterprise fixtures for all 9 roles."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Organization).filter(Organization.id == "org-01").first():
            print("[Database Seeder] Database already populated. Skipping duplicate seed.")
            return

        now = datetime.now(timezone.utc)
        print("[Database Seeder] Seeding database with initial schema and 9-role accounts...")

        # 1. Organization
        org = Organization(
            id="org-01",
            name="Nexus Tech University",
            type="Academic Institution",
            subtype="Engineering & Technology",
            description="Leading premier technological institute hosting national hackathons.",
            country="India",
            city="Hyderabad",
            website="https://nexus.edu",
            size="Enterprise (500+)",
            contact_email="hackathon-ops@nexus.edu",
            plan="Enterprise",
        )
        db.add(org)

        # 2. Users for all 9 roles
        default_pwd = get_password_hash("EventOps@2026")
        admin_pwd = get_password_hash("SuperAdmin@2026")

        users_data = [
            ("usr-super", "Alexander Sterling", "superadmin@eventops.demo", admin_pwd, "SUPER_ADMIN"),
            ("usr-org", "Dean Sarah Jenkins", "orgadmin@eventops.demo", default_pwd, "ORGANIZATION_ADMIN"),
            ("usr-event", "Vikramaditya Roy", "eventadmin@eventops.demo", default_pwd, "EVENT_ADMIN"),
            ("usr-coord", "Elena Rostova", "coordinator@eventops.demo", default_pwd, "COORDINATOR"),
            ("J001", "Dr. Marcus Vance", "marcus.vance@mit.edu", default_pwd, "JUDGE"),
            ("vol-01", "Priya Nair", "volunteer@eventops.demo", default_pwd, "VOLUNTEER"),
            ("part-01", "Aarav Sharma", "aarav.sharma@tkrcet.ac.in", default_pwd, "PARTICIPANT"),
            ("tech-01", "Karthik Raja", "techstaff@eventops.demo", default_pwd, "TECHNICAL_STAFF"),
            ("res-01", "Sneha Reddy", "resources@eventops.demo", default_pwd, "RESOURCE_MANAGER"),
            # VISTERA domain aliases
            ("usr-v-vol", "Volunteer Lead", "volunteer@vistera.org", default_pwd, "VOLUNTEER"),
            ("usr-v-jdg", "Senior Evaluator", "judge@vistera.org", default_pwd, "JUDGE"),
            ("usr-v-tch", "Network Engineer", "tech@vistera.org", default_pwd, "TECHNICAL_STAFF"),
            ("usr-v-res", "Logistics Lead", "resources@vistera.org", default_pwd, "RESOURCE_MANAGER"),
            ("usr-v-prt", "Hackathon Finalist", "participant@vistera.org", default_pwd, "PARTICIPANT"),
        ]

        for uid, uname, uemail, upass, urole in users_data:
            user = User(
                id=uid,
                name=uname,
                email=uemail,
                password_hash=upass,
                role=urole,
                organization_id="org-01",
            )
            db.add(user)

            membership = OrganizationMembership(
                user_id=uid,
                organization_id="org-01",
                role=urole,
                status="ACTIVE",
            )
            db.add(membership)

        db.commit()

        # 3. Main Event: VISTERA 2026
        event = Event(
            id="evt-01",
            organization_id="org-01",
            owner_id="usr-event",
            is_personal_event=False,
            name="VISTERA 2026 National Hackathon",
            type="Hackathon",
            description="National 48-Hour AI and Distributed Systems Hackathon with multi-track evaluations.",
            location="Nexus Convention Complex, Hall 4",
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=3),
            registration_deadline=now + timedelta(hours=12),
            status="LIVE",
            expected_participants=250,
            current_round=1,
            total_rounds=2,
        )
        db.add(event)
        db.commit()

        # Event Members for scoped authentication
        event_members = [
            ("em-01", "evt-01", "usr-event", "Vikramaditya Roy", "eventadmin@eventops.demo", "EVENT_ADMIN"),
            ("em-02", "evt-01", "usr-coord", "Elena Rostova", "coordinator@eventops.demo", "COORDINATOR"),
            ("em-03", "evt-01", "J001", "Dr. Marcus Vance", "marcus.vance@mit.edu", "JUDGE"),
            ("em-04", "evt-01", "vol-01", "Priya Nair", "volunteer@eventops.demo", "VOLUNTEER"),
            ("em-05", "evt-01", "tech-01", "Karthik Raja", "techstaff@eventops.demo", "TECHNICAL_STAFF"),
            ("em-06", "evt-01", "res-01", "Sneha Reddy", "resources@eventops.demo", "RESOURCE_MANAGER"),
            ("em-07", "evt-01", "usr-v-vol", "Volunteer Lead", "volunteer@vistera.org", "VOLUNTEER"),
            ("em-08", "evt-01", "usr-v-jdg", "Senior Evaluator", "judge@vistera.org", "JUDGE"),
            ("em-09", "evt-01", "usr-v-tch", "Network Engineer", "tech@vistera.org", "TECHNICAL_STAFF"),
            ("em-10", "evt-01", "usr-v-res", "Logistics Lead", "resources@vistera.org", "RESOURCE_MANAGER"),
            ("em-11", "evt-01", "usr-v-prt", "Hackathon Finalist", "participant@vistera.org", "PARTICIPANT"),
        ]

        for em_id, ev_id, u_id, m_name, m_email, m_role in event_members:
            db.add(EventMember(
                id=em_id,
                event_id=ev_id,
                user_id=u_id,
                name=m_name,
                email=m_email,
                role=m_role,
                status="ACTIVE",
            ))

        # 4. Rounds & Rubrics
        r1 = Round(
            id="rnd-1",
            event_id="evt-01",
            name="Round 1 — Architecture & Feasibility",
            round_order=1,
            status="IN_PROGRESS",
            start_time=now,
            end_time=now + timedelta(hours=6),
            qualifying_quota=20,
        )
        r2 = Round(
            id="rnd-2",
            event_id="evt-01",
            name="Round 2 — Final Grand Jury Presentation",
            round_order=2,
            status="UPCOMING",
            start_time=now + timedelta(hours=8),
            end_time=now + timedelta(hours=14),
            qualifying_quota=5,
        )
        db.add_all([r1, r2])
        db.commit()

        criteria = [
            ("c1", "rnd-1", "Technical Architecture & Code Quality", 25.0, 0.25, "System robustness and codebase modularity"),
            ("c2", "rnd-1", "Innovation & Novelty", 25.0, 0.25, "Uniqueness of technical problem solving"),
            ("c3", "rnd-1", "Feasibility & Prototype Execution", 25.0, 0.25, "Working hardware or software proof-of-concept"),
            ("c4", "rnd-1", "Presentation & Articulation", 25.0, 0.25, "Clarity of demonstration and Q&A responses"),
        ]
        for cid, rid, cname, max_s, w, cdesc in criteria:
            db.add(RoundCriterion(id=cid, round_id=rid, name=cname, max_score=max_s, weight=w, description=cdesc))

        # 5. Venues & Benches
        venues_data = [
            ("ven-01", "Alan Turing Grand Lab", "Main Tower", "3rd Floor", 40, ["AI / Machine Learning", "Distributed Systems"]),
            ("ven-02", "Ada Lovelace Innovation Hall", "Science Wing", "2nd Floor", 30, ["FinTech & Payments", "CyberSecurity"]),
            ("ven-03", "Nikola Tesla Hardware Lab", "Engineering Annex", "Ground Floor", 25, ["IoT & Robotics", "CleanTech"]),
        ]

        for vid, vname, bldg, flr, cap, doms in venues_data:
            ven = Venue(
                id=vid,
                event_id="evt-01",
                name=vname,
                building=bldg,
                floor=flr,
                capacity=cap,
                has_power=True,
                has_internet=True,
                is_accessible=True,
                equipment=["High-Speed Ethernet", "Dedicated 16A Sockets", "Dual Monitors"],
                supported_domains=doms,
                status="ACTIVE",
            )
            db.add(ven)
            db.commit()

            # Add benches
            for b_idx in range(1, 11):
                bench = Bench(
                    id=f"{vid}-B{b_idx:02d}",
                    venue_id=vid,
                    label=f"Bench {b_idx:02d}",
                    status="available",
                    has_power=True,
                    has_ethernet=True,
                )
                db.add(bench)
            db.commit()

        # 6. Judges
        judges_data = [
            ("J001", "usr-super", "Dr. Marcus Vance", "marcus.vance@mit.edu", "MIT AI Lab", "Principal Research Scientist", ["AI / Machine Learning"]),
            ("J002", "usr-org", "Dr. Sarah Connor", "sarah.connor@cyberdyne.org", "Stanford CS", "Associate Professor", ["Distributed Systems", "CyberSecurity"]),
        ]
        for jid, uid, jname, jemail, jorg, jtitle, jdoms in judges_data:
            db.add(Judge(
                id=jid,
                event_id="evt-01",
                user_id=uid,
                name=jname,
                email=jemail,
                organization=jorg,
                title=jtitle,
                domains=jdoms,
                workload_status="AVAILABLE",
            ))

        # 7. Teams
        teams_data = [
            ("T001", "NeuralMesh", "Aarav Sharma", "aarav.sharma@tkrcet.ac.in", "AI / Machine Learning", "ven-01", "ven-01-B01", ["J001"]),
            ("T002", "QuantumGuard", "Maya Sen", "maya.sen@iitb.ac.in", "CyberSecurity", "ven-02", "ven-02-B01", ["J002"]),
            ("T003", "BioPulse Health", "Rohan Gupta", "rohan.g@bits.ac.in", "HealthTech & Bio", "ven-01", "ven-01-B02", ["J001"]),
            ("T004", "AeroSync Robotics", "Kavya Patel", "kavya.p@nitk.ac.in", "IoT & Robotics", "ven-03", "ven-03-B01", ["J002"]),
            ("T005", "ChainShield Core", "Devraj Rao", "devraj@iiith.ac.in", "Distributed Systems / Web3", "ven-02", "ven-02-B02", ["J002"]),
        ]

        for tid, tname, l_name, l_email, dom, v_id, b_id, j_ids in teams_data:
            qr_tok = generate_qr_token(tid, "evt-01")
            team = Team(
                id=tid,
                event_id="evt-01",
                name=tname,
                lead_name=l_name,
                lead_email=l_email,
                project_title=f"{tname} Next-Gen System",
                project_abstract=f"An enterprise solution built for {dom} hackathon track.",
                project_domain=dom,
                repo_url=f"https://github.com/vistera2026/{tname.lower()}",
                demo_url=f"https://{tname.lower()}.demo.eventops.run",
                tech_stack=["React", "FastAPI", "Python", "PostgreSQL"],
                hardware_requirements=["Dedicated 16A Power", "High-Bandwidth Subnet"],
                registration_status="APPROVED",
                check_in_status="NOT_CHECKED_IN",
                assigned_venue_id=v_id,
                assigned_bench_id=b_id,
                assigned_judges=j_ids,
                current_round=1,
                qr_code_token=qr_tok,
            )
            db.add(team)
            db.commit()

            # Add team members
            db.add(TeamMember(
                id=f"mem-{tid}-01",
                team_id=tid,
                name=l_name,
                email=l_email,
                role="LEADER",
                organization_or_school="TKRCET",
            ))
            db.add(TeamMember(
                id=f"mem-{tid}-02",
                team_id=tid,
                name=f"{l_name.split()[0]} Teammate",
                email=f"teammate.{tid.lower()}@domain.com",
                role="MEMBER",
                organization_or_school="TKRCET",
            ))
            db.commit()

        # 8. Resources
        resources = [
            ("res-01", "evt-01", "BADGES", "NFC / QR Holographic Badges", 300, 45, "badges"),
            ("res-02", "evt-01", "KITS", "Hardware Dev Kits & Breadboards", 100, 25, "kits"),
            ("res-03", "evt-01", "MEALS", "Dinner Meal Vouchers", 350, 0, "vouchers"),
        ]
        for rid, eid, cat, iname, tot, dist, unit in resources:
            db.add(Resource(id=rid, event_id=eid, category=cat, item_name=iname, total_quantity=tot, distributed_quantity=dist, unit=unit))

        # 9. Incidents
        db.add(Incident(
            id="inc-01",
            event_id="evt-01",
            title="Fluctuating Power Outlet in Lab 3",
            description="Voltage drop reported on Bench 04 electrical circuit breaker.",
            category="FACILITIES",
            severity="MEDIUM",
            status="INVESTIGATING",
            location="Nikola Tesla Hardware Lab, Bench 04",
            reported_by="Karthik Raja (Technical Staff)",
            assigned_to="Campus Electrical Unit",
        ))

        db.commit()
        print("[Database Seeder] Successfully seeded all tables, 9 roles, teams, venues, and VISTERA 2026 data.")

    except Exception as e:
        db.rollback()
        print(f"[Database Seeder] Seeding error: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

