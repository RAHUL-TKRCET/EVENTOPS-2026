"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { judgesApi } from "@/lib/api/judges";
import { eventsApi } from "@/lib/api/events";
import { EventItem } from "@/types";
import { Scale, ArrowLeft, Mail, Phone, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

export default function CreateJudgePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [domains, setDomains] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [availability, setAvailability] = useState<"FULL_TIME" | "PART_TIME">("FULL_TIME");
  const [assignedEvent, setAssignedEvent] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdJudge, setCreatedJudge] = useState<{ id: string; invitationStatus?: string; emailDelivery?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingEvents(true);
      try {
        const rows = await eventsApi.getAll();
        if (!cancelled) {
          setEvents(rows);
          setAssignedEvent(rows[0]?.id || "");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load organization events.");
      } finally {
        if (!cancelled) setIsLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!assignedEvent) {
      setError("Choose an event before enrolling the judge.");
      return;
    }
    setIsLoading(true);
    try {
      const newJudge = await judgesApi.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        organization: organization.trim(),
        designation: designation.trim(),
        expertise: expertise.split(",").map((item) => item.trim()).filter(Boolean),
        domains: domains.split(",").map((item) => item.trim()).filter(Boolean),
        maxTeamCapacity: Math.max(1, Number.parseInt(capacity, 10) || 10),
        availability,
        workloadStatus: "AVAILABLE",
        eventId: assignedEvent,
      });
      // The API stores an enrollment only. No email provider or acceptance-token flow
      // is configured, so this must not be described as an invitation being delivered.
      setCreatedJudge(newJudge as unknown as { id: string; invitationStatus?: string; emailDelivery?: string });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Judge enrollment failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/judges" className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white" aria-label="Back to judges">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Enroll & assign judge</h2>
          <p className="text-sm text-slate-400">Enroll a judge for one of your events and configure team assignments.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
      {createdJudge && (
        <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Judge enrollment saved.</p>
          <p className="mt-1">The record is stored, but email delivery and account activation are not configured. No invitation email has been sent.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push(`/judges/${createdJudge.id}`)}>View judge record</Button>
            <Button variant="primary" onClick={() => router.push("/judges")}>Return to judges</Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-white">Administrative enrollment only</p>
            <p className="text-xs leading-5 text-slate-300">Enrolling or assigning a judge does not allow an Organization Admin to score as that judge. Judges need their own verified event-scoped account to score.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Judge email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4 text-slate-500" />} />
          <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone className="h-4 w-4 text-slate-500" />} />
          <Input label="Affiliated organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <Input label="Professional title" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          <Select label="Assign event" value={assignedEvent} onChange={(e) => setAssignedEvent(e.target.value)} disabled={isLoadingEvents || events.length === 0}
            options={events.map((event) => ({ value: event.id, label: event.name }))} />
          <Input label="Domain expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} hint="Comma-separated" />
          <Input label="Evaluator domains" value={domains} onChange={(e) => setDomains(e.target.value)} hint="Comma-separated" />
          <Input label="Maximum team capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value as "FULL_TIME" | "PART_TIME")}
            options={[{ value: "FULL_TIME", label: "Full time" }, { value: "PART_TIME", label: "Part time" }]} />
        </div>

        {isLoadingEvents && <p className="text-xs text-slate-400">Loading your organization's events…</p>}
        {!isLoadingEvents && events.length === 0 && !error && <p className="text-sm text-amber-200">Create an event first; judge enrollment must be attached to one of your events.</p>}

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/judges")}>Cancel</Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoadingEvents || events.length === 0 || !!createdJudge}
            leftIcon={<UserPlus className="h-4 w-4" />}>Enroll judge</Button>
        </div>
      </form>
    </div>
  );
}
