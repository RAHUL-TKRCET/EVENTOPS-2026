"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { teamsApi } from "@/lib/api/teams";
import { Users, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("Team Hyperion");
  const [leadName, setLeadName] = useState("Samantha Brooks");
  const [leadEmail, setLeadEmail] = useState("samantha.b@stanford.edu");
  const [projectTitle, setProjectTitle] = useState("Hyperion: Ultra-Low Latency Decentralized Sequencer");
  const [domain, setDomain] = useState("Distributed Systems / Web3");
  const [abstractText, setAbstractText] = useState(
    "A Byzantine-fault-tolerant parallel sequencer for L2 rollups achieving 20,000 TPS under simulated network partitions."
  );
  const [hardwareReqs, setHardwareReqs] = useState("Isolated 10Gbps Ethernet, 2x 16A Power");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newTeam = await teamsApi.register({
      name,
      leadName,
      leadEmail,
      project: {
        title: projectTitle,
        abstract: abstractText,
        domain,
        techStack: ["Rust", "Solidity", "TypeScript"],
        hardwareRequirements: hardwareReqs.split(",").map((s) => s.trim()),
      },
    });

    setIsLoading(false);
    router.push(`/teams/${newTeam.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/teams"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Register New Innovation Team</h2>
          <p className="text-xs text-slate-400">
            Submit team roster and project requirements for CP-SAT allocation and jury matching.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Team Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label="Domain Track"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            options={[
              { value: "AI / Machine Learning", label: "AI / Machine Learning" },
              { value: "Distributed Systems / Web3", label: "Distributed Systems / Web3" },
              { value: "FinTech & Payments", label: "FinTech & Payments" },
              { value: "HealthTech & Bio", label: "HealthTech & Bio" },
              { value: "IoT & Robotics", label: "IoT & Robotics" },
              { value: "CleanTech & Green Energy", label: "CleanTech & Green Energy" },
              { value: "CyberSecurity", label: "CyberSecurity" },
            ]}
          />

          <Input
            label="Team Captain Full Name"
            required
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
          />

          <Input
            label="Captain Email"
            type="email"
            required
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-800">
          <Input
            label="Project Title"
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
          />

          <Textarea
            label="Executive Abstract & Technical Scope"
            value={abstractText}
            onChange={(e) => setAbstractText(e.target.value)}
          />

          <Input
            label="Special Hardware / Network Prerequisites"
            value={hardwareReqs}
            onChange={(e) => setHardwareReqs(e.target.value)}
            hint="OR-Tools solver matches these constraints against room capabilities."
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/teams")}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Register Team & Generate Pass
          </Button>
        </div>
      </form>
    </div>
  );
}
