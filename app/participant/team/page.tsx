"use client";

import React, { useState } from "react";
import { mockTeams } from "@/lib/mock-data/teams";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Users, Mail, Phone, Building2, Utensils, Shirt, UserPlus, CheckCircle2 } from "lucide-react";

export default function ParticipantTeamPage() {
  const [team, setTeam] = useState(mockTeams.find((t) => t.id === "T042") || mockTeams[0]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    const newMember = {
      id: `mem-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      phone: "+1 555-0199",
      role: "MEMBER" as const,
      organizationOrSchool: "Stanford University",
      dietaryPreference: "VEG" as const,
      tShirtSize: "L" as const,
      checkInStatus: "CHECKED_IN" as const,
      checkedInAt: new Date().toISOString(),
    };
    setTeam({ ...team, members: [...team.members, newMember] });
    setIsInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-pink-400 uppercase">Team ID: {team.id}</span>
            <StatusBadge status={team.registrationStatus} />
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">{team.name}</h1>
          <p className="text-xs text-slate-400">Team Roster, Dietary Preferences, and Emergency Contacts</p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsInviteOpen(true)}
        >
          Add Teammate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.members.map((m) => (
          <div
            key={m.id}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{m.name}</h3>
                  {m.role === "LEADER" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Team Captain
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{m.organizationOrSchool}</span>
                </div>
              </div>
              <StatusBadge status={m.checkInStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{m.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{m.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Meal: {m.dietaryPreference || "VEG"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shirt className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>T-Shirt: {m.tShirtSize || "L"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Add Team Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Jordan Lee"
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="jordan.lee@university.edu"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
