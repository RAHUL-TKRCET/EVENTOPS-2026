import crypto from "crypto";
import { config } from "../../config";
import { inMemoryTeams } from "../teams/teams.service";

export interface ScanResult {
  valid: boolean;
  message: string;
  team?: any;
  member?: any;
  bench?: string;
  venue?: string;
  checkedInAt?: string;
}

export class AttendanceService {
  public static generateSignedQRToken(teamId: string, eventId: string, memberId?: string): string {
    const payload = {
      teamId,
      eventId,
      memberId: memberId || null,
      role: "PARTICIPANT",
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString("hex"),
    };

    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const hmac = crypto.createHmac("sha256", config.qr.hmacSecret);
    hmac.update(encoded);
    const signature = hmac.digest("base64url");

    return `EO.${encoded}.${signature}`;
  }

  public static verifyScannedQR(rawToken: string, volunteerId?: string): ScanResult {
    if (!rawToken || !rawToken.startsWith("EO.")) {
      // Support legacy demo tokens
      const team = inMemoryTeams.find((t) => t.qrCodeToken === rawToken || t.id === rawToken);
      if (team) {
        team.checkInStatus = "CHECKED_IN";
        team.checkedInTime = new Date().toISOString();
        return {
          valid: true,
          message: "Check-in verified successfully (Demo Pass)",
          team: { id: team.id, name: team.name, leadName: team.leadName },
          bench: team.assignedBench || "B001",
          venue: team.assignedVenueName || "Main Hall",
          checkedInAt: team.checkedInTime,
        };
      }
      return { valid: false, message: "Invalid QR code format. Not an authentic EVENTOPS cryptographic token." };
    }

    const parts = rawToken.split(".");
    if (parts.length !== 3) {
      return { valid: false, message: "Malformed cryptographic ticket structure." };
    }

    const [, encodedPayload, providedSignature] = parts;

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", config.qr.hmacSecret);
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return { valid: false, message: "Cryptographic signature validation failed. Potential forged ticket." };
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

      // Check expiration (48 hours)
      const ageHours = (Date.now() - payload.timestamp) / (1000 * 60 * 60);
      if (ageHours > config.qr.tokenValidityHours) {
        return { valid: false, message: "Ticket expired. Please regenerate your pass." };
      }

      const team = inMemoryTeams.find((t) => t.id === payload.teamId);
      if (!team) {
        return { valid: false, message: "Associated team does not exist in registry." };
      }

      // Check if already checked in
      const wasCheckedIn = team.checkInStatus === "CHECKED_IN";
      team.checkInStatus = "CHECKED_IN";
      team.checkedInTime = team.checkedInTime || new Date().toISOString();

      return {
        valid: true,
        message: wasCheckedIn ? "Participant already checked in. Displaying verified details." : "Attendee check-in successfully confirmed!",
        team: {
          id: team.id,
          name: team.name,
          leadName: team.leadName,
          leadEmail: team.leadEmail,
          projectTitle: team.project.title,
        },
        bench: team.assignedBench || "B-04",
        venue: team.assignedVenueName || "Turing Lab 101",
        checkedInAt: team.checkedInTime,
      };
    } catch (err: any) {
      return { valid: false, message: `Error parsing ticket payload: ${err.message}` };
    }
  }

  public static getTelemetry(eventId: string) {
    const teams = inMemoryTeams.filter((t) => t.eventId === eventId);
    const totalTeams = teams.length;
    const checkedInTeams = teams.filter((t) => t.checkInStatus === "CHECKED_IN").length;
    const partialTeams = teams.filter((t) => t.checkInStatus === "PARTIAL").length;
    const pendingTeams = teams.filter((t) => t.checkInStatus === "NOT_CHECKED_IN").length;

    return {
      totalExpected: totalTeams * 4,
      teamsTotal: totalTeams,
      checkedInTeams,
      partialTeams,
      pendingTeams,
      completionRate: totalTeams > 0 ? Math.round((checkedInTeams / totalTeams) * 100) : 0,
      timestamp: new Date().toISOString(),
    };
  }
}

