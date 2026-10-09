"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { organizationsApi } from "@/lib/api/organizations";
import { useAppStore } from "@/store";
import { Building2, ArrowRight, Sparkles } from "lucide-react";
import { OrganizationType } from "@/types";

export default function OnboardingOrganizationPage() {
  const router = useRouter();
  const { setCurrentOrganization } = useAppStore();
  const [name, setName] = useState("VISTRA Innovations Corp");
  const [type, setType] = useState<OrganizationType>("Business / Corporate");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("San Francisco");
  const [website, setWebsite] = useState("https://vistrainnovate.io");
  const [size, setSize] = useState("500-1000");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const org = await organizationsApi.create({
      name,
      type,
      country,
      city,
      website,
      size,
    });
    setCurrentOrganization(org);
    setIsLoading(false);
    router.push("/events/create");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white font-mono">Create Organization Workspace</h2>
          <p className="text-xs text-slate-400">
            Set up your organization tenant to govern events, allocate venues, and manage juries.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Organization Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Stanford AI Lab or VISTRA Corp"
          />

          <Select
            label="Organization Type"
            value={type}
            onChange={(e) => setType(e.target.value as OrganizationType)}
            options={[
              { value: "Educational Institution", label: "Educational Institution (College / Univ)" },
              { value: "Business / Corporate", label: "Business / Corporate / Enterprise" },
              { value: "Event Organizer", label: "Professional Event Organizer / Agency" },
              { value: "Community / Non-Profit", label: "Community / NGO / Association" },
              { value: "Other", label: "Other Domain Organization" },
            ]}
          />

          <Input
            label="Country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <Input
            label="City"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="Official Website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
          />

          <Select
            label="Organization Scale"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            options={[
              { value: "1-10", label: "1-10 people" },
              { value: "10-50", label: "10-50 people" },
              { value: "50-200", label: "50-200 people" },
              { value: "200-1000", label: "200-1000 people" },
              { value: "1000+", label: "1000+ Enterprise / Large University" },
            ]}
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <button
            type="button"
            onClick={() => router.push("/onboarding/personal-event")}
            className="text-xs text-slate-400 hover:text-indigo-400 transition cursor-pointer"
          >
            Looking to run a solo/personal event instead? →
          </button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Organization & Proceed
          </Button>
        </div>
      </form>
    </div>
  );
}
