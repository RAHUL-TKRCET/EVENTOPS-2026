"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { organizationsApi } from "@/lib/api/organizations";
import { useAppStore } from "@/store";
import { Building, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { Organization } from "@/types";

export default function JoinOrganizationPage() {
  const router = useRouter();
  const { setCurrentOrganization } = useAppStore();
  const [inviteCode, setInviteCode] = useState("VISTRA-ENT-2026-HQ");
  const [previewOrg, setPreviewOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    const res = await organizationsApi.joinWithCode(inviteCode);
    setPreviewOrg(res.organization);
    setIsLoading(false);
  };

  const handleConfirmJoin = () => {
    if (previewOrg) {
      setCurrentOrganization(previewOrg);
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 md:p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
          <Building className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">
          Join an Existing Organization
        </h2>
        <p className="text-xs text-slate-400">
          Enter the secure enterprise invitation code issued by your organization administrator.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="Invitation Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="e.g. ORG-XXXX-XXXX"
          />
        </div>

        <Button
          size="md"
          variant="outline"
          className="w-full"
          onClick={handleVerify}
          isLoading={isLoading}
        >
          Verify Invitation Code
        </Button>

        {previewOrg && (
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white">{previewOrg.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-600 text-white">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {previewOrg.city}, {previewOrg.country} • {previewOrg.type}
            </p>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleConfirmJoin}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Accept Invitation & Enter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
