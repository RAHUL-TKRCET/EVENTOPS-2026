"use client";

import React, { useState } from "react";
import { aiApi } from "@/lib/api/ai";
import { AIChatMessage } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ArrowRight,
  Cpu,
  Building,
  AlertTriangle,
  Scale,
  Users,
  CheckCircle2,
} from "lucide-react";

const quickPrompts = [
  "Show me all absent teams.",
  "Which judges are overloaded?",
  "Find available rooms for 5 teams.",
  "Why is Team T042 allocated to Room 204?",
  "Show today's critical incidents.",
  "Recommend a better allocation.",
];

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "init",
      sender: "AI",
      timestamp: new Date().toISOString(),
      content:
        "Hello! I am your EventOps Operational Copilot. I monitor turnstiles, evaluate jury loads, check room power lines, and interface directly with the Google OR-Tools CP-SAT scheduling solver. What would you like to inspect?",
      suggestedActions: [
        { label: "Show absent teams", actionType: "QUERY_ABSENT" },
        { label: "Which judges are overloaded?", actionType: "QUERY_JUDGES" },
        { label: "Show critical incidents", actionType: "QUERY_INCIDENTS" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      timestamp: new Date().toISOString(),
      content: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const aiReply = await aiApi.processQuery(queryText);
      setMessages((prev) => [...prev, aiReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "SEND_SMS":
        alert("Dispatched automated SMS check-in reminders to absent team leads.");
        break;
      case "RELEASE_BENCHES":
        alert("Standby benches released to waitlist.");
        break;
      case "REBALANCE_JUDGES":
      case "ACTIVATE_STANDBY":
        router.push("/allocation/optimization");
        break;
      case "LOCK_ROOM":
        router.push("/venues");
        break;
      case "VIEW_TEAM":
        router.push("/teams/T042");
        break;
      case "VIEW_VENUE":
        router.push("/venues/R004");
        break;
      case "OPEN_CONTROL_CENTER":
        router.push("/control-center");
        break;
      case "PAGE_TECH":
        alert("Paging Sarah Jenkins (Technical Staff Lead) via pager webhook.");
        break;
      case "QUERY_ABSENT":
        sendMessage("Show me all absent teams.");
        break;
      case "QUERY_JUDGES":
        sendMessage("Which judges are overloaded?");
        break;
      case "QUERY_INCIDENTS":
        sendMessage("Show today's critical incidents.");
        break;
      default:
        sendMessage(actionType);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
      {/* Left Sidebar: Quick Commands & Capabilities */}
      <div className="w-full md:w-72 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 shrink-0 flex flex-col">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            Operations Copilot
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Natural-language operations querying powered by semantic understanding with mathematical CP-SAT execution.
        </p>

        <div className="space-y-1.5 flex-1 overflow-y-auto pt-2">
          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Quick Operational Commands:
          </span>
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="w-full text-left p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 text-xs text-slate-300 transition cursor-pointer leading-snug"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Solver Ready</span>
          </div>
          <p className="text-indigo-300/80">
            CP-SAT is calibrated for 120 teams and 20 judges.
          </p>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.sender === "AI";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isAI ? "" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAI
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`space-y-2.5 ${isAI ? "" : "text-right"}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isAI
                        ? "bg-slate-900 border border-slate-800 text-slate-200"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Render Structured Result Cards if present */}
                  {msg.structuredData && (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 text-left animate-in zoom-in-95 duration-150">
                      {msg.structuredData.type === "JUDGE_OVERLOAD" && (
                        <div className="space-y-2 text-xs">
                          <span className="font-mono text-rose-400 font-bold uppercase text-[10px]">
                            Jury Overload Audit
                          </span>
                          {msg.structuredData.payload.map((j: any) => (
                            <div key={j.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-white">{j.name} ({j.id})</span>
                                <p className="text-[11px] text-slate-400">{j.organization} • {j.teamsAssigned} Teams</p>
                              </div>
                              <span className="font-mono text-rose-400 font-bold">{j.workloadPct}% Workload</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.structuredData.type === "ABSENT_TEAMS" && (
                        <div className="space-y-2 text-xs">
                          <span className="font-mono text-amber-400 font-bold uppercase text-[10px]">
                            Pending Physical Check-In
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {msg.structuredData.payload.teams.slice(0, 4).map((t: any) => (
                              <div key={t.id} className="p-2 rounded bg-slate-900 border border-slate-800">
                                <span className="font-mono text-indigo-400 font-bold">{t.id}</span>
                                <p className="font-medium text-slate-200 truncate">{t.name}</p>
                                <p className="text-[10px] text-slate-500">{t.room} • {t.bench}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.structuredData.type === "ROOM_AVAILABILITY" && (
                        <div className="space-y-2 text-xs">
                          <span className="font-mono text-emerald-400 font-bold uppercase text-[10px]">
                            Available Facilities for Spillover
                          </span>
                          {msg.structuredData.payload.map((r: any) => (
                            <div key={r.room} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-white">{r.name}</span>
                                <p className="text-[11px] text-slate-400">{r.freeBenches} free benches • 16A Power Ready</p>
                              </div>
                              <span className="font-mono text-emerald-400 font-bold">READY</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.structuredData.type === "INCIDENT_SUMMARY" && (
                        <div className="space-y-2 text-xs">
                          <span className="font-mono text-rose-400 font-bold uppercase text-[10px]">
                            Priority Incident Telemetry
                          </span>
                          {msg.structuredData.payload.map((inc: any) => (
                            <div key={inc.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-white">{inc.title}</span>
                                <p className="text-[11px] text-slate-400">{inc.location} • Assigned: {inc.assignedTo}</p>
                              </div>
                              <StatusBadge status={inc.priority} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Suggested Action Buttons */}
                  {msg.suggestedActions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(act.actionType)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Interrogating operations registry & solver state...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot about absent teams, overloaded judges, room capacity, or solver status..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !input.trim()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
