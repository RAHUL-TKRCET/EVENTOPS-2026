"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { ArrowLeft, ExternalLink, Code2, Cpu, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function TeamProjectPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teams/${team.id}`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Project Specs: {team.project.title}</h2>
          <p className="text-xs text-slate-400">Technical documentation, repository, and live demo artifacts.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div>
          <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{team.project.domain}</span>
          <h3 className="text-lg font-bold text-slate-100 mt-1">{team.project.title}</h3>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">Technical Abstract</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {team.project.abstract}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">Tech Stack & Architecture</h4>
          <div className="flex flex-wrap gap-2">
            {team.project.techStack.map((tech) => (
              <span key={tech} className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-800 text-slate-200 border border-slate-700">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {team.project.hardwareRequirements && (
          <div>
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">Hardware Constraints</h4>
            <div className="flex flex-wrap gap-2">
              {team.project.hardwareRequirements.map((req) => (
                <span key={req} className="px-3 py-1 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          {team.project.repoUrl && (
            <a href={team.project.repoUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" leftIcon={<Code2 className="w-4 h-4" />}>
                Source Repository
              </Button>
            </a>
          )}
          {team.project.demoUrl && (
            <a href={team.project.demoUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="primary" leftIcon={<ExternalLink className="w-4 h-4" />}>
                Live Interactive Demo
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
