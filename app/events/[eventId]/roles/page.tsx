"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { UserRole } from "@/types";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Wrench,
  Package,
  Building,
  CheckCircle2,
  Copy,
  Trash2,
  Search,
  ExternalLink,
  ArrowLeft,
  Mail,
  Lock,
  Sparkles,
} from "lucide-react";

interface EventMember {
  id: string;
  event_id: string;
  user_id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  title?: string;
  zone_or_dept?: string;
  status: string;
  created_at: string;
}

const delegatableRoles: { value: UserRole; label: string; desc: string; icon: any; color: string }[] = [
  { value: "VOLUNTEER", label: "Volunteer", desc: "Turnstile Check-In, QR Scanning & Floor Ops", icon: HeartHandshake, color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
  { value: "JUDGE", label: "Judge / Evaluator", desc: "Jury Panel, Team Assessment & Rubrics", icon: Scale, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "COORDINATOR", label: "Coordinator", desc: "Stage Schedules & Rapid Floor Resolution", icon: ShieldCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "TECHNICAL_STAFF", label: "Technical Staff", desc: "Hardware, Power, Wi-Fi & AV Readiness", icon: Wrench, color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  { value: "RESOURCE_MANAGER", label: "Resource Manager", desc: "Badges, Merchandise Kits & Meal Tokens", icon: Package, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin", desc: "Campus Dean & Enterprise Tenant Oversight", icon: Building, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
];

export default function EventRolesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const [members, setMembers] = useState<EventMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("VOLUNTEER");
  const [title, setTitle] = useState("Floor Operations");
  const [zoneOrDept, setZoneOrDept] = useState("Main Hall");
  const [password, setPassword] = useState("EventOps@2026");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("eventops_token") : "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/events/${eventId}/members`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (_) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [eventId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`http://localhost:5000/api/v1/events/${eventId}/members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          email,
          role,
          phone,
          title,
          zoneOrDept,
          password,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccessLink(json.inviteLink);
        // Refresh roster
        fetchMembers();
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert("Failed to add member: " + (errJson.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to add member: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this enrolled member from the event?")) return;
    try {
      await fetch(`http://localhost:5000/api/v1/events/${eventId}/members/${memberId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      fetchMembers();
    } catch (_) {}
  };

  const handleCopy = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Overview
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">STAFFING & ROLES CONTROL</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Enrolled Roles & Staff Delegation
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Add and manage authorized Volunteers, Judges, Coordinators, Technical Staff, and Resource Managers specifically enrolled in <strong className="text-slate-200">{event.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsAddModalOpen(true);
              setSuccessLink(null);
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Role / Member
          </Button>
        </div>
      </div>

      {/* Role Counts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {delegatableRoles.map((r) => {
          const count = members.filter((m) => m.role === r.value).length;
          const Icon = r.icon;
          return (
            <div
              key={r.value}
              onClick={() => setRoleFilter(roleFilter === r.value ? "ALL" : r.value)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer text-left space-y-1.5 ${
                roleFilter === r.value
                  ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-1.5 rounded-lg border text-xs ${r.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-base font-bold font-mono text-white">{count}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 truncate">{r.label}</p>
                <p className="text-[10px] text-slate-400 truncate">Enrolled</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Role / Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  Delegate Event Role
                </h3>
                <p className="text-xs text-slate-400">
                  Assign official privileges for <span className="text-slate-200 font-semibold">{event.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            {successLink ? (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  Member Successfully Enrolled in PostgreSQL!
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The account has been created and assigned. Share this personalized event login link with the member:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 break-all select-all">
                  <span className="truncate flex-1">{successLink}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(successLink)}
                    leftIcon={copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedLink ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSuccessLink(null);
                      setIsAddModalOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4">
                {/* Role Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Assigned Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {delegatableRoles.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 text-white"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-bold leading-tight">{r.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{r.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                  />
                  <Input
                    label="Work / Academic Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Operational Title / Duty"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lead Jury / Floor Staff"
                  />
                  <Input
                    label="Assigned Zone / Department"
                    value={zoneOrDept}
                    onChange={(e) => setZoneOrDept(e.target.value)}
                    placeholder="e.g. Hall 1 / AI Track"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Initial Passcode"
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Default: EventOps@2026"
                  />
                  <Input
                    label="Contact Phone (Optional)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    rightIcon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Enroll & Generate Login Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Roster Controls & Search */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Showing {filteredMembers.length} of {members.length} enrolled members
            </span>
            {roleFilter !== "ALL" && (
              <button
                onClick={() => setRoleFilter("ALL")}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Clear filter ({roleFilter})
              </button>
            )}
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name, email or duty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-mono">
              Loading enrolled event roles from PostgreSQL...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-mono space-y-3">
              <p>No enrolled members found for {roleFilter === "ALL" ? "this event" : `role ${roleFilter}`}.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(true);
                  setSuccessLink(null);
                }}
              >
                + Delegate First Member
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                  <th className="p-3 font-semibold">Name & Email</th>
                  <th className="p-3 font-semibold">Assigned Role</th>
                  <th className="p-3 font-semibold">Duty / Zone</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((m) => {
                  const roleMeta = delegatableRoles.find((r) => r.value === m.role);
                  const memberLink = `http://localhost:3000/events/${eventId}/login?email=${encodeURIComponent(m.email)}&role=${m.role}`;

                  return (
                    <tr key={m.id} className="hover:bg-slate-900/50 transition text-slate-300">
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleMeta?.color || "text-slate-300 border-slate-700 bg-slate-800"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-300">
                        <div>{m.title || "—"}</div>
                        <div className="text-[10px] text-slate-500">{m.zone_or_dept || "—"}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopy(memberLink)}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white transition"
                            title="Copy personalized event login link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 text-rose-400 hover:text-rose-300 transition"
                            title="Revoke and remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
