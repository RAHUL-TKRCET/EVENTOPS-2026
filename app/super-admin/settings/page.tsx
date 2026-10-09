"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ShieldCheck, Key, Database, Sparkles, Check } from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-mono">Platform Infrastructure Settings</h2>
        <p className="text-xs text-slate-400">
          Global backend connection hooks, OR-Tools CP-SAT solver timeouts, and LLM embedding providers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>FastAPI & PostgreSQL Cluster Integration Hook</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Target API Gateway URL" defaultValue="https://api.eventops.internal/v1" />
            <Input label="WebSocket Realtime URL" defaultValue="wss://stream.eventops.internal/ws" />
            <Input label="OR-Tools Solver Pool Nodes" defaultValue="16 Workers (CP-SAT v9.8)" />
            <Select
              label="Embedding & LLM Semantic Matcher"
              defaultValue="gemini-embeddings"
              options={[
                { value: "gemini-embeddings", label: "Google Vertex AI Text-Embedding-004" },
                { value: "local-onnx", label: "Self-Hosted BGE-M3 / ONNX Microservice" },
                { value: "openai", label: "OpenAI text-embedding-3-small" },
              ]}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Global Rate Limiting & Safety Rails</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Max Concurrent Solver Jobs" defaultValue="8 concurrent solves" />
            <Input label="QR Check-in Token Rotation (seconds)" defaultValue="3600 (1 hour)" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" /> Cluster configuration synchronized
            </span>
          )}
          <Button type="submit" variant="primary" size="md" className="ml-auto">
            Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
