import { AIChatMessage } from "@/types";

export const aiApi = {
  async processQuery(query: string): Promise<AIChatMessage> {
    await new Promise((r) => setTimeout(r, 600));
    const normalized = query.toLowerCase();

    if (normalized.includes("absent")) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: "AI",
        timestamp: new Date().toISOString(),
        content: "Identified 6 absent teams who have not completed QR check-in as of 01:30 PM. Their designated benches in Room 102 and 205 remain on standby hold.",
        structuredData: {
          type: "ABSENT_TEAMS",
          payload: {
            count: 6,
            teams: [
              { id: "T015", name: "Sentient Mesh", room: "R003", bench: "B015" },
              { id: "T029", name: "Quantum Ledger", room: "R006", bench: "B029" },
              { id: "T042", name: "BioSense", room: "R004", bench: "B042", status: "Checked in recently!" },
              { id: "T078", name: "AeroShield", room: "R016", bench: "B078" },
              { id: "T100", name: "SolarPulse", room: "R020", bench: "B100" },
              { id: "T116", name: "VeriChain", room: "R024", bench: "B116" },
            ],
          },
        },
        suggestedActions: [
          { label: "Dispatch SMS Reminder to Team Leads", actionType: "SEND_SMS" },
          { label: "Release Unclaimed Benches to Waitlist", actionType: "RELEASE_BENCHES" },
        ],
      };
    }

    if (normalized.includes("overload") || normalized.includes("judges")) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: "AI",
        timestamp: new Date().toISOString(),
        content: "Workload analysis reveals 2 judges operating above the 85% fatigue threshold. Standard deviation across the jury pool is currently σ = 0.62.",
        structuredData: {
          type: "JUDGE_OVERLOAD",
          payload: [
            { id: "J007", name: "Dr. Elena Rostova", organization: "BioGenomics AI", workloadPct: 92, status: "Overloaded", teamsAssigned: 8 },
            { id: "J012", name: "Chloe Dupont", organization: "Station F Paris", workloadPct: 87, status: "High Workload", teamsAssigned: 7 },
          ],
        },
        suggestedActions: [
          { label: "Execute OR-Tools Re-Balance Optimizer", actionType: "REBALANCE_JUDGES" },
          { label: "Activate Standby Judge J010 (MIT)", actionType: "ACTIVATE_STANDBY" },
        ],
      };
    }

    if (normalized.includes("room") || normalized.includes("available")) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: "AI",
        timestamp: new Date().toISOString(),
        content: "Located 3 fully equipped suites with immediate capacity for 5+ teams, complete with 10Gbps Ethernet and dedicated power.",
        structuredData: {
          type: "ROOM_AVAILABILITY",
          payload: [
            { room: "R022", name: "Room 404 - Claude Shannon Wing", freeBenches: 5, powerReady: true, ethernetReady: true },
            { room: "R023", name: "Room 405 - Ada Lovelace Wing", freeBenches: 4, powerReady: true, ethernetReady: true },
            { room: "R024", name: "Room 406 - Turing Block", freeBenches: 5, powerReady: true, ethernetReady: true },
          ],
        },
        suggestedActions: [
          { label: "Lock Room R022 for Spillover Teams", actionType: "LOCK_ROOM" },
        ],
      };
    }

    if (normalized.includes("t042") || normalized.includes("why")) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: "AI",
        timestamp: new Date().toISOString(),
        content: "Team T042 (BioSense Glucose Predictor) is fully allocated. They require high-voltage DC telemetry and were mapped to Room R004, Bench B042 under evaluators J007 & J012 for the 08:00 PM slot. All hard constraints satisfied (100% score).",
        suggestedActions: [
          { label: "Inspect Team T042 Profile & QR", actionType: "VIEW_TEAM" },
          { label: "View Claude Shannon Room Map", actionType: "VIEW_VENUE" },
        ],
      };
    }

    if (normalized.includes("incident") || normalized.includes("critical")) {
      return {
        id: `ai-msg-${Date.now()}`,
        sender: "AI",
        timestamp: new Date().toISOString(),
        content: "Current operations audit reports 1 CRITICAL incident and 1 HIGH priority incident requiring attention.",
        structuredData: {
          type: "INCIDENT_SUMMARY",
          payload: [
            { id: "INC-2041", title: "Access Point 3B Intermittent Packet Drop", priority: "CRITICAL", location: "Room 205", assignedTo: "Sarah Jenkins" },
            { id: "INC-2042", title: "Tripped 24V Breaker on Bench Row 8", priority: "HIGH", location: "Room 102", assignedTo: "Facilities Electrics" },
          ],
        },
        suggestedActions: [
          { label: "Open Real-Time Control Center", actionType: "OPEN_CONTROL_CENTER" },
          { label: "Page Technical Escalation On-Call", actionType: "PAGE_TECH" },
        ],
      };
    }

    // Default conversational response
    return {
      id: `ai-msg-${Date.now()}`,
      sender: "AI",
      timestamp: new Date().toISOString(),
      content: `I analyzed your query: "${query}". All operational systems (QR Attendance, OR-Tools CP-SAT Allocator, Jury Scoring, and Incidents) are running within SLA limits. What specific workflow or optimization would you like to run?`,
      suggestedActions: [
        { label: "Show absent teams", actionType: "QUERY_ABSENT" },
        { label: "Review overloaded judges", actionType: "QUERY_JUDGES" },
        { label: "Check real-time control metrics", actionType: "OPEN_CONTROL_CENTER" },
      ],
    };
  },
};
