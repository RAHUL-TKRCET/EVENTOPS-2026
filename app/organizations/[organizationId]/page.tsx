"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export default function OrganizationRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { selectOrganizationWorkspace } = useAppStore();

  useEffect(() => {
    if (params?.organizationId) {
      selectOrganizationWorkspace(params.organizationId as string);
      router.replace("/dashboard");
    }
  }, [params, router, selectOrganizationWorkspace]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-mono text-xs">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Organization Workspace...</span>
      </div>
    </div>
  );
}
