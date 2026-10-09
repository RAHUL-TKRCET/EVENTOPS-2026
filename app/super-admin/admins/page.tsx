"use client";

import React, { useState } from "react";
import { mockUsers } from "@/lib/mock-data/users";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ShieldCheck, UserPlus, Mail, Phone, Lock, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState(
    mockUsers.filter((u) => u.role === "SUPER_ADMIN" || u.role === "ORGANIZATION_ADMIN")
  );
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ORGANIZATION_ADMIN">("ORGANIZATION_ADMIN");

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    const newAdmin = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organizationId: "org-01",
      createdAt: new Date().toISOString(),
    };
    setAdmins([newAdmin, ...admins]);
    setIsInviteOpen(false);
    setName("");
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/super-admin")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Super Admin
            </Button>
            <span className="font-mono text-xs text-purple-400 font-bold uppercase">
              Privileged Accounts
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Platform Admin Management</h1>
          <p className="text-xs text-slate-400">
            Provision and audit global super administrators and organization tier owners
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsInviteOpen(true)}
        >
          Add Administrator
        </Button>
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Active Privileged Users ({admins.length})
        </h3>

        <div className="divide-y divide-slate-800">
          {admins.map((admin) => (
            <div key={admin.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{admin.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      admin.role === "SUPER_ADMIN"
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                        : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                    }`}
                  >
                    {admin.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{admin.email}</div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Enrolled: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "Active"}
                </span>
                <StatusBadge status="ACTIVE" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Provision New Admin">
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <Input
            label="Administrator Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan Sterling"
          />
          <Input
            label="Corporate Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@eventops.io"
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Privilege Scope</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
            >
              <option value="ORGANIZATION_ADMIN">Organization Admin (Tenant Owner)</option>
              <option value="SUPER_ADMIN">Super Admin (Global Root Clearance)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Provision Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
