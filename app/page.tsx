"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ShieldCheck,
  Calendar,
  Users,
  Cpu,
  QrCode,
  ArrowRight,
  Lock,
  Sparkles,
  Building2,
  CheckCircle2,
  Radio,
  Layers,
  Compass,
  ClipboardCheck,
  UserRoundPlus,
  CircleHelp,
  ChartNoAxesCombined,
  Workflow,
  X,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, setCurrentRole } = useAppStore();

  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("REGISTER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSuperAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (authMode === "LOGIN") {
        // Let the backend resolve the stored role, then route only recognized
        // administrator accounts to their appropriate workspace.
        const res = await authApi.login(email, password);
        if (res.user.role !== "SUPER_ADMIN" && res.user.role !== "ORGANIZATION_ADMIN") {
          await authApi.logout();
          setErrorMsg("This page is for the head administrator. Event team members should use their event link to sign in.");
          return;
        }
        setCurrentUser(res.user);
        setCurrentRole(res.user.role);
        router.push(res.user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
      } else {
        // Public onboarding provisions a new organization owner. Platform-wide
        // SUPER_ADMIN access is never self-selected through public registration.
        const res = await authApi.register({
          name,
          email,
          password,
          role: "ORGANIZATION_ADMIN",
          organizationName,
        });
        setCurrentUser(res.user);
        setCurrentRole(res.user.role);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "We could not authenticate this account. Check your details and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJumpToEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const code = eventCode.trim();
    if (!code) return;
    router.push(`/events/${encodeURIComponent(code)}/portal`);
  };

  const scrollToAccess = (mode: "LOGIN" | "REGISTER") => {
    setAuthMode(mode);
    setErrorMsg(null);
    setMobileNavOpen(false);
    window.setTimeout(() => {
      document.getElementById("get-started")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const features = [
    {
      icon: Calendar,
      number: "01",
      title: "Event command, in one place",
      description:
        "Create an event workspace, organize rounds and schedules, and give the right people access to the right event.",
    },
    {
      icon: Users,
      number: "02",
      title: "People and roles, properly scoped",
      description:
        "Bring in Event Admins, coordinators, judges, volunteers, participants, and operations staff through event assignments.",
    },
    {
      icon: QrCode,
      number: "03",
      title: "Check-in without the queues",
      description:
        "Use QR-based attendance workflows to help teams move from registration to their assigned venue.",
    },
    {
      icon: Cpu,
      number: "04",
      title: "Smarter space allocation",
      description:
        "Plan venues, benches, time slots, and judging assignments with constraint-based allocation tools.",
    },
  ];

  const steps = [
    {
      icon: UserRoundPlus,
      title: "Create the head account",
      text: "The organization or event head creates a Super Admin account from this public page.",
    },
    {
      icon: Layers,
      title: "Open your control room",
      text: "After registration, you go straight to your Super Admin dashboard.",
    },
    {
      icon: Calendar,
      title: "Create your first event",
      text: "Set up event details and generate a dedicated event entry link.",
    },
    {
      icon: ShieldCheck,
      title: "Assign event roles",
      text: "Activate and assign the remaining roles in the context of the event they belong to.",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#080c16] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-56 left-[12%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.09] blur-[130px]" />
        <div className="absolute right-[-12rem] top-[34rem] h-[35rem] w-[35rem] rounded-full bg-blue-600/[0.10] blur-[140px]" />
        <div className="absolute bottom-[-12rem] left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-violet-500/[0.08] blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080c16]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="EVENTOPS home" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black tracking-tight text-slate-950 shadow-lg shadow-cyan-500/15">
              EO
            </div>
            <div>
              <span className="block text-base font-black tracking-[0.16em] text-white">EVENTOPS</span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.19em] text-slate-500">
                Event operations platform
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a href="#platform" className="text-sm text-slate-400 transition hover:text-white">Platform</a>
            <a href="#how-it-works" className="text-sm text-slate-400 transition hover:text-white">How it works</a>
            <a href="#event-roles" className="text-sm text-slate-400 transition hover:text-white">Event roles</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(currentUser.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard")}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Open workspace
              </Button>
            ) : (
              <>
                <button type="button" onClick={() => scrollToAccess("LOGIN")} className="px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white">
                  Sign in
                </button>
                <Button variant="primary" size="sm" onClick={() => scrollToAccess("REGISTER")} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Create Super Admin
                </Button>
              </>
            )}
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 md:hidden"
            type="button"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-white/10 bg-[#0b1120] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
              <a onClick={() => setMobileNavOpen(false)} href="#platform" className="text-sm text-slate-300">Platform</a>
              <a onClick={() => setMobileNavOpen(false)} href="#how-it-works" className="text-sm text-slate-300">How it works</a>
              <a onClick={() => setMobileNavOpen(false)} href="#event-roles" className="text-sm text-slate-300">Event roles</a>
              <button type="button" onClick={() => scrollToAccess("LOGIN")} className="text-left text-sm text-slate-300">Sign in</button>
              <Button variant="primary" size="md" onClick={() => scrollToAccess("REGISTER")} className="w-full">Create Super Admin account</Button>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-cyan-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                One platform. Every moving part.
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-[4.4rem]">
                Great events don’t{" "}
                <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  run themselves.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
                EVENTOPS brings your event team, schedules, venues, check-ins and live operations into one coordinated workspace — from the first plan to the final score.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {currentUser ? (
                  <Button variant="primary" size="lg" onClick={() => router.push(currentUser.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard")} rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Continue to workspace
                  </Button>
                ) : (
                  <>
                    <Button variant="primary" size="lg" onClick={() => scrollToAccess("REGISTER")} rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Create your Super Admin account
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => scrollToAccess("LOGIN")}>
                      Sign in to EVENTOPS
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Event-scoped access</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> One place to coordinate</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Built for event teams</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-violet-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#101827]/95 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Workflow className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-bold text-white">Event overview</p>
                      <p className="text-[11px] text-slate-500">One coordinated workspace</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-200">Live operations</span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-5">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Workspace</p>
                    <p className="mt-2 text-sm font-semibold text-white">Centralized</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">People</p>
                    <p className="mt-2 text-sm font-semibold text-white">Role-based</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Planning</p>
                    <p className="mt-2 text-sm font-semibold text-white">Connected</p>
                  </div>
                </div>

                <div className="mx-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1220]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                    <span className="text-xs font-semibold text-slate-300">Event lifecycle</span>
                    <span className="text-[10px] text-slate-500">Plan → Run → Review</span>
                  </div>
                  <div className="space-y-4 p-4">
                    {[
                      { icon: Building2, title: "Head administrator", detail: "Owns the workspace", color: "text-violet-200 bg-violet-300/10", status: "START HERE" },
                      { icon: Calendar, title: "Create an event", detail: "Set the event up and share its link", color: "text-cyan-200 bg-cyan-300/10", status: "NEXT" },
                      { icon: Users, title: "Assign event team", detail: "Activate access for the event", color: "text-emerald-200 bg-emerald-300/10", status: "THEN" },
                    ].map((item, index) => (
                      <div key={item.title} className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}><item.icon className="h-5 w-5" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                        </div>
                        <span className="text-[9px] font-bold tracking-wider text-slate-500">{item.status}</span>
                        {index < 2 && <span className="sr-only">Next step follows.</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><Lock className="h-3.5 w-3.5 text-cyan-200" /> Access follows verified assignments</div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">EVENTOPS 2026</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.015] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-300/[0.07] text-blue-200"><Compass className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-white">Already part of an event?</p><p className="text-xs text-slate-500">Open your event’s portal with the event code or link.</p></div>
            </div>
            <form onSubmit={handleJumpToEvent} className="flex w-full gap-2 sm:max-w-md">
              <label className="sr-only" htmlFor="event-code">Event code</label>
              <input
                id="event-code"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="Enter event code"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
              />
              <Button type="submit" size="md" variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>Open event</Button>
            </form>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">A clearer way to run events</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Every moving part, connected.</h2>
              <p className="mt-4 text-base leading-7 text-slate-400">From planning and staffing to check-in and judging, keep event work organized and visible.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article key={feature.number} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"><feature.icon className="h-5 w-5" /></div>
                    <span className="font-mono text-xs text-slate-600">{feature.number}</span>
                  </div>
                  <h3 className="mt-6 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-y border-white/[0.06] bg-white/[0.015] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Start at the top</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your first step sets up the rest.</h2>
              <p className="mt-4 text-base leading-7 text-slate-400">EVENTOPS starts with the person responsible for the organization and event programme. Other operational access follows from the events they are assigned to.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <article key={step.title} className="relative rounded-2xl border border-white/[0.08] bg-[#0b1120]/80 p-5">
                  <span className="font-mono text-xs font-bold text-cyan-200">STEP 0{index + 1}</span>
                  <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-slate-200"><step.icon className="h-5 w-5" /></div>
                  <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
                  {index < steps.length - 1 && <ArrowRight className="absolute right-5 top-7 hidden h-4 w-4 text-slate-600 lg:block" />}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="event-roles" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200"><ShieldCheck className="h-6 w-6" /></div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Roles belong to events, not a dropdown.</h2>
              <p className="mt-4 text-base leading-7 text-slate-400">The head administrator creates the event first. The event team is then assigned access for that event, and each person enters the workspace appropriate to their verified assignment.</p>
              <div className="mt-6 space-y-3">
                {["Event Admin", "Coordinator", "Judge", "Volunteer", "Participant / Team", "Technical Staff", "Resource Manager"].map((role) => (
                  <div key={role} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />{role}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
              <p className="text-sm font-semibold text-white">One event. The right access for every team member.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Event administrators manage their assigned event. Coordinators handle the floor, judges score assigned teams, volunteers carry out tasks, and participants use their own team portal.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { icon: Calendar, label: "Event Admin" },
                  { icon: Compass, label: "Coordinator" },
                  { icon: ClipboardCheck, label: "Judge" },
                  { icon: Users, label: "Volunteer" },
                  { icon: Building2, label: "Participant" },
                  { icon: Cpu, label: "Technical staff" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.07] bg-[#0b1120] p-3">
                    <item.icon className="h-4 w-4 text-cyan-200" />
                    <p className="mt-2 text-xs font-medium text-slate-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="get-started" className="scroll-mt-24 border-y border-white/[0.07] bg-gradient-to-br from-cyan-300/[0.07] via-blue-500/[0.035] to-violet-400/[0.07] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-start">
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Your workspace starts here</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{authMode === "REGISTER" ? "Create the head administrator account." : "Welcome back to EVENTOPS."}</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">
                {authMode === "REGISTER"
                  ? "Set up the head administrator account for your organization. Once created, you’ll enter your workspace and create your events from there."
                  : "Sign in with your existing administrator account to return to platform or organization setup."}
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-cyan-200"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">A single starting point</p><p className="mt-1 text-sm leading-6 text-slate-500">The public page introduces the platform and starts your organization’s event operations workspace.</p></div></div>
                <div className="flex gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-cyan-200"><Workflow className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">Event-first access</p><p className="mt-1 text-sm leading-6 text-slate-500">Other operational roles are connected to events and assignments, rather than created as independent privileged workspaces.</p></div></div>
                <div className="flex gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-cyan-200"><CircleHelp className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-white">Joining an existing event?</p><p className="mt-1 text-sm leading-6 text-slate-500">Use the event link or code section above. Access will still depend on your event assignment.</p></div></div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.1] bg-[#0e1625]/95 p-5 shadow-2xl shadow-black/25 sm:p-8">
              {currentUser?.role === "SUPER_ADMIN" ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-200"><ShieldCheck className="h-7 w-7" /></div>
                  <h3 className="text-xl font-semibold text-white">Your Super Admin workspace is ready</h3>
                  <p className="text-sm text-slate-400">Signed in as <span className="font-semibold text-cyan-200">{currentUser.name}</span>.</p>
                  <Button variant="primary" size="lg" className="w-full" onClick={() => router.push("/super-admin")} rightIcon={<ArrowRight className="h-4 w-4" />}>Open Super Admin dashboard</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-[#080c16] p-1">
                    <button type="button" onClick={() => { setAuthMode("REGISTER"); setErrorMsg(null); }} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${authMode === "REGISTER" ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}>Create account</button>
                    <button type="button" onClick={() => { setAuthMode("LOGIN"); setErrorMsg(null); }} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${authMode === "LOGIN" ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/10" : "text-slate-400 hover:text-white"}`}>Sign in</button>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-200"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{authMode === "REGISTER" ? "Set up your head administrator account" : "Sign in as administrator"}</h3>
                        <p className="mt-1 text-xs text-slate-500">{authMode === "REGISTER" ? "For the organization head or head administrator." : "Access your existing head administrator workspace."}</p>
                      </div>
                    </div>
                  </div>

                  {errorMsg && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{errorMsg}</div>}

                  <form onSubmit={handleSuperAdminAuth} className="space-y-4">
                    {authMode === "REGISTER" && (
                      <>
                        <Input label="Head administrator name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                        <Input label="Organization / institution name" required autoComplete="organization" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Your college, company or event organization" />
                      </>
                    )}
                    <Input label="Email address" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.org" />
                    <Input label="Password" type="password" required autoComplete={authMode === "REGISTER" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                    <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>
                      {isLoading ? "Please wait…" : authMode === "REGISTER" ? "Create Super Admin & continue" : "Sign in to your workspace"}
                    </Button>
                  </form>

                  <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
                    Your administrator account is the starting point. Event access for the rest of the team is managed after events are created.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-cyan-200"><ChartNoAxesCombined className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-white">EVENTOPS 2026</p><p className="text-xs text-slate-500">Plan clearly. Coordinate confidently. Run the event.</p></div>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-slate-500"><a href="#platform" className="transition hover:text-slate-300">Platform</a><a href="#how-it-works" className="transition hover:text-slate-300">How it works</a><a href="#get-started" className="transition hover:text-slate-300">Get started</a></div>
          </div>
          <p className="mx-auto mt-6 max-w-7xl border-t border-white/[0.06] pt-5 text-[11px] text-slate-600">© 2026 EVENTOPS. Event access and actions remain subject to verified account and event permissions.</p>
        </section>
      </main>
    </div>
  );
}
