"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/lib/api/events";
import { invitationsApi, CreatedInvitation, Invitation, InvitableEventRole } from "@/lib/api/invitations";
import { EventItem, UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Copy, ExternalLink, MailPlus, RefreshCw, ShieldCheck, Users, UserRoundCheck, XCircle } from "lucide-react";

interface EventMemberRecord {
  id: string;
  eventId: string;
  userId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  title?: string | null;
  zoneOrDept?: string | null;
  status: string;
  createdAt?: string | null;
}

const roleOptions: { value: InvitableEventRole; label: string }[] = [
  { value: "EVENT_ADMIN", label: "Event Admin" },
  { value: "COORDINATOR", label: "Coordinator" },
  { value: "JUDGE", label: "Judge / Evaluator" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "PARTICIPANT", label: "Participant" },
  { value: "TECHNICAL_STAFF", label: "Technical Staff" },
  { value: "RESOURCE_MANAGER", label: "Resource Manager" },
];

function buildAcceptanceUrl(token: string): string {
  const prefix = window.location.pathname.replace(/\/?people\/?$/, "");
  const url = new URL(`${prefix}/invitations/accept`, window.location.origin);
  url.searchParams.set("token", token);
  return url.toString();
}

function readableRole(role: string): string {
  return role.replaceAll("_", " ");
}

export default function PeoplePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [members, setMembers] = useState<EventMemberRecord[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableEventRole>("JUDGE");
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitation | null>(null);
  const [acceptanceUrl, setAcceptanceUrl] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedEvent = useMemo(() => events.find((item) => item.id === eventId) || null, [events, eventId]);

  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setError("");
    try {
      const result = await eventsApi.getAll();
      setEvents(result);
      setEventId((current) => current && result.some((item) => item.id === current) ? current : (result[0]?.id || ""));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load events for your authorized organization.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const loadPeople = useCallback(async () => {
    if (!eventId) {
      setMembers([]);
      setInvitations([]);
      return;
    }
    setIsLoadingPeople(true);
    setError("");
    const [memberResult, invitationResult] = await Promise.allSettled([
      eventsApi.getMembers(eventId),
      invitationsApi.list(eventId),
    ]);
    if (memberResult.status === "fulfilled") {
      setMembers(memberResult.value as EventMemberRecord[]);
    } else {
      setMembers([]);
      setError(memberResult.reason instanceof Error ? memberResult.reason.message : "Unable to load event members.");
    }
    if (invitationResult.status === "fulfilled") {
      setInvitations(invitationResult.value);
    } else {
      setInvitations([]);
      const invitationError = invitationResult.reason instanceof Error ? invitationResult.reason.message : "Unable to load invitations.";
      setError((current) => current ? `${current} ${invitationError}` : invitationError);
    }
    setIsLoadingPeople(false);
  }, [eventId]);

  useEffect(() => { void loadPeople(); }, [loadPeople]);

  const handleCreateInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventId || !email.trim()) return;
    setIsCreating(true);
    setError("");
    setNotice("");
    setCreatedInvitation(null);
    setAcceptanceUrl("");
    try {
      const created = await invitationsApi.create({ email: email.trim().toLowerCase(), role, eventId });
      setCreatedInvitation(created);
      setAcceptanceUrl(buildAcceptanceUrl(created.token));
      setEmail("");
      setNotice("Invitation created. Copy the link now; the raw token is only returned when the invitation is created.");
      await loadPeople();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to create invitation.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (invitation: Invitation) => {
    if (invitation.status !== "PENDING") return;
    if (!window.confirm(`Revoke the pending invitation for ${invitation.email}?`)) return;
    setError("");
    setNotice("");
    try {
      await invitationsApi.revoke(invitation.id);
      setNotice(`Invitation for ${invitation.email} revoked.`);
      await loadPeople();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to revoke invitation.");
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setNotice("Invitation link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access was blocked. Select and copy the invitation link manually.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
          </button>
          <div className="flex items-center gap-2 text-indigo-300">
            <Users className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Organization access</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">People & Roles</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">Manage event memberships and invitations within the event scope authorized for your account.</p>
        </div>
        <Button variant="outline" onClick={() => { void loadEvents(); void loadPeople(); }} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400"><UserRoundCheck className="h-4 w-4 text-emerald-300" /> Active / recorded assignments</div>
          <div className="mt-2 text-2xl font-semibold text-white">{members.length}</div>
          <p className="mt-1 text-xs text-slate-500">Current selected event</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400"><MailPlus className="h-4 w-4 text-indigo-300" /> Pending invitations</div>
          <div className="mt-2 text-2xl font-semibold text-white">{invitations.filter((item) => item.status === "PENDING").length}</div>
          <p className="mt-1 text-xs text-slate-500">Single-use · seven-day expiry</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="h-4 w-4 text-sky-300" /> Permission boundary</div>
          <div className="mt-2 text-lg font-semibold text-white">Server-enforced</div>
          <p className="mt-1 text-xs text-slate-500">UI selections never grant access by themselves</p>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div>}

      {isLoadingEvents ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">Loading your authorized events…</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-500" />
          <h2 className="mt-3 font-semibold text-white">No events in this workspace</h2>
          <p className="mt-1 text-sm text-slate-400">Create an organization-owned event before assigning event roles.</p>
          <Button className="mt-4" onClick={() => router.push("/events/create")}>Create event</Button>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Invite someone to an event</h2>
              <p className="mt-1 text-sm text-slate-400">Choose the event and role. Email delivery is not configured, so copy the secure acceptance link after creating an invitation.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Event</span>
                  <select value={eventId} onChange={(e) => { setEventId(e.target.value); setCreatedInvitation(null); setAcceptanceUrl(""); setNotice(""); }} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500">
                    {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Email address</span>
                  <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Event role</span>
                  <select value={role} onChange={(e) => setRole(e.target.value as InvitableEventRole)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-500">
                    {roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <Button type="submit" className="w-full sm:w-auto" isLoading={isCreating} disabled={isCreating || !eventId} leftIcon={<MailPlus className="h-4 w-4" />}>Create invitation</Button>
              </form>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <h3 className="font-semibold text-white">Invitation delivery</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">The backend stores only a hash of the token. The raw token appears only in the creation response; the page generates the acceptance URL for copying.</p>
                {createdInvitation && acceptanceUrl ? (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-emerald-300">Created for {createdInvitation.email} · {readableRole(createdInvitation.role)}</div>
                    <textarea readOnly value={acceptanceUrl} rows={3} aria-label="Invitation acceptance link" className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 outline-none" />
                    <Button variant="outline" onClick={() => void copyText(acceptanceUrl)} leftIcon={<Copy className="h-4 w-4" />}>{copied ? "Copied" : "Copy acceptance link"}</Button>
                    <p className="text-xs text-amber-200">No email was sent. Share this link only with the intended recipient.</p>
                    <a href={acceptanceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200">Open acceptance page <ExternalLink className="h-3 w-3" /></a>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">A new invitation link will appear here once an invitation is created.</p>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-800 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-white">People assigned to {selectedEvent?.name || "selected event"}</h2>
                <p className="mt-1 text-xs text-slate-400">Membership records are read from the authenticated backend; changing a role or disabling a member is not offered until a matching backend endpoint exists.</p>
              </div>
              <span className="text-xs text-slate-500">{members.length} assignment{members.length === 1 ? "" : "s"}</span>
            </div>
            {isLoadingPeople ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading event people and invitations…</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No membership records were returned for this event.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
                    <tr><th className="px-5 py-3">Person</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Assigned</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((member) => (
                      <tr key={member.id} className="text-slate-300">
                        <td className="px-5 py-4"><div className="font-medium text-white">{member.name}</div><div className="mt-0.5 text-xs text-slate-500">{member.email}</div></td>
                        <td className="px-5 py-4"><span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200">{readableRole(member.role)}</span></td>
                        <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${member.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-800 text-slate-300"}`}>{member.status}</span></td>
                        <td className="px-5 py-4 text-xs text-slate-500">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="border-b border-slate-800 p-5">
              <h2 className="font-semibold text-white">Invitations</h2>
              <p className="mt-1 text-xs text-slate-400">Pending, accepted, expired and revoked invitations for the selected event.</p>
            </div>
            {isLoadingPeople ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading invitations…</div>
            ) : invitations.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No invitations have been created for this event.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
                    <tr><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invitations.map((item) => (
                      <tr key={item.id} className="text-slate-300">
                        <td className="px-5 py-4 break-all">{item.email}</td>
                        <td className="px-5 py-4">{readableRole(item.role)}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "PENDING" ? "bg-amber-500/10 text-amber-200" : "bg-slate-800 text-slate-300"}`}>{item.status}</span></td>
                        <td className="px-5 py-4 text-xs text-slate-500">{new Date(item.expiresAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-right">{item.status === "PENDING" ? <Button variant="outline" size="sm" onClick={() => void handleRevoke(item)} leftIcon={<XCircle className="h-3.5 w-3.5" />}>Revoke</Button> : <span className="text-xs text-slate-600">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
