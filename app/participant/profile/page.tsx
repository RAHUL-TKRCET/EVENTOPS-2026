"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { User, Check, ShieldCheck, Mail, Phone, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ParticipantProfilePage() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const [name, setName] = useState(currentUser.name || "Devon Zhang");
  const [email, setEmail] = useState(currentUser.email || "student@eventops.demo");
  const [phone, setPhone] = useState("+1 415-555-0456");
  const [dietary, setDietary] = useState("VEG");
  const [tShirt, setTShirt] = useState("L");
  const [emergencyContact, setEmergencyContact] = useState("Jane Zhang (+1 415-555-0911)");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">
            Participant Preferences
          </span>
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">My Attendee Profile</h1>
        <p className="text-xs text-slate-400">
          Manage your personal details, meal badge preferences, and emergency contact
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Profile preferences synchronized with event operations system.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <Input
          label="Full Legal / Professional Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
          />
          <Input
            label="Mobile Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            leftIcon={<Phone className="w-4 h-4 text-slate-500" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Dietary Meal Preference"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            options={[
              { value: "VEG", label: "Vegetarian" },
              { value: "NON_VEG", label: "Non-Vegetarian" },
              { value: "JAIN", label: "Jain Vegetarian" },
              { value: "VEGAN", label: "Vegan" },
            ]}
          />
          <Select
            label="Event T-Shirt Size"
            value={tShirt}
            onChange={(e) => setTShirt(e.target.value)}
            options={[
              { value: "S", label: "Small (S)" },
              { value: "M", label: "Medium (M)" },
              { value: "L", label: "Large (L)" },
              { value: "XL", label: "Extra Large (XL)" },
              { value: "XXL", label: "Double Extra Large (XXL)" },
            ]}
          />
        </div>

        <Input
          label="Emergency Contact Name & Phone"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="e.g. Guardian Name (+1 ...)"
        />

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/incidents/create")}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          >
            Report Incident / Issue
          </Button>

          <Button type="submit" variant="primary" size="md">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
