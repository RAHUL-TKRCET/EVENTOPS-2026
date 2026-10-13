import { AlertTriangle } from "lucide-react";

export function DemoModeNotice() {
  return (
    <section
      role="note"
      aria-label="Demo data notice"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold">Demo workspace — not connected to live operational data</p>
        <p className="text-xs leading-5 text-amber-100/80">
          Values on this page use sample fixtures or in-memory state. Changes are not saved to the server and must not be treated as real event operations. Live API integration and role-scoped persistence are still pending.
        </p>
      </div>
    </section>
  );
}
