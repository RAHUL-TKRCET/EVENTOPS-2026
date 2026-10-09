"use client";

import React, { useState } from "react";
import { mockTeams } from "@/lib/mock-data/teams";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, GitBranch, ExternalLink, Cpu, Check, Layers } from "lucide-react";

export default function ParticipantProjectPage() {
  const team = mockTeams.find((t) => t.id === "T042") || mockTeams[0];
  const [project, setProject] = useState(
    team?.project || {
      title: "Edge AI Non-Invasive Glucose Predictor",
      abstract: "Continuous health telemetry system.",
      domain: "Healthcare",
      techStack: ["Next.js", "PyTorch"],
    }
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">Project Dossier</span>
          <StatusBadge status="ACTIVE" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">{project.title}</h1>
        <p className="text-xs text-slate-400">
          This dossier is automatically synced with assigned jury rubrics and evaluation systems.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Project details and submission links updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Project Title</label>
          <Input
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Abstract & Architecture Overview</label>
          <textarea
            value={project.abstract}
            onChange={(e) => setProject({ ...project, abstract: e.target.value })}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Domain / Innovation Track</label>
            <Input
              value={project.domain}
              onChange={(e) => setProject({ ...project, domain: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Public Git Repository</label>
            <Input
              value={project.repoUrl || ""}
              onChange={(e) => setProject({ ...project, repoUrl: e.target.value })}
              placeholder="https://github.com/..."
              leftIcon={<GitBranch className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Technologies & Frameworks Deployed</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <Button variant="primary" size="md" type="submit">
            Save Project Updates
          </Button>
        </div>
      </form>
    </div>
  );
}
