"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { OrganizationType, InstitutionSubtype, BusinessSubtype, CommunitySubtype } from "@/types";

const INSTITUTION_SUBTYPES: InstitutionSubtype[] = [
  "College",
  "University",
  "School",
  "Training Institute",
  "Other Institution",
];

const BUSINESS_SUBTYPES: BusinessSubtype[] = [
  "Company",
  "Startup",
  "Enterprise",
  "Event Agency",
  "Other Business",
];

const COMMUNITY_SUBTYPES: CommunitySubtype[] = [
  "NGO",
  "Association",
  "Club",
  "Community Group",
  "Other Community",
];

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { createOrganization, currentUser } = useAppStore();

  const [formData, setFormData] = useState({
    name: "",
    type: "Institution" as OrganizationType,
    subtype: "College",
    description: "",
    city: "",
    country: "India",
    contactEmail: currentUser?.email || "",
    contactPhone: "",
    website: "",
    size: "100-500",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // When type changes, adjust default subtype
  const handleTypeChange = (type: OrganizationType) => {
    let defaultSubtype = "";
    if (type === "Institution") defaultSubtype = "College";
    if (type === "Business") defaultSubtype = "Company";
    if (type === "Community") defaultSubtype = "NGO";

    setFormData((prev) => ({
      ...prev,
      type,
      subtype: defaultSubtype,
    }));
  };

  const getSubtypesForType = () => {
    if (formData.type === "Institution") return INSTITUTION_SUBTYPES;
    if (formData.type === "Business") return BUSINESS_SUBTYPES;
    return COMMUNITY_SUBTYPES;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      createOrganization({
        name: formData.name,
        type: formData.type,
        subtype: formData.subtype,
        description: formData.description,
        city: formData.city || "Bengaluru",
        country: formData.country,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        website: formData.website,
        size: formData.size,
      });

      setCreatedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-mono">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm font-mono tracking-wider">EVENTOPS</span>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Organization Setup Step 1 of 1
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        {createdSuccess ? (
          <div className="text-center p-12 rounded-2xl border border-emerald-500/40 bg-slate-900/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Organization Created Successfully!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              You are now assigned as the <span className="text-emerald-400 font-semibold font-mono">ORGANIZATION_ADMIN</span>. Redirecting to your Organization Dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>TENANT REGISTRATION</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Your Organization</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Establish an organization workspace for your university, company, or community. As the creator, you will receive full Organization Admin privileges.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl space-y-6">
              {/* Organization Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Organization Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["Institution", "Business", "Community"] as OrganizationType[]).map((type) => {
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/15"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{type}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-2 font-mono">
                          {type === "Institution" && "Colleges, Universities & Schools"}
                          {type === "Business" && "Companies, Startups & Agencies"}
                          {type === "Community" && "NGOs, Clubs & Associations"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtype Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Specific Subtype * ({formData.type})
                </label>
                <select
                  value={formData.subtype}
                  onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  {getSubtypesForType().map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organization Name & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TKR College of Engineering or Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Est. Organization Size
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="1-50">1 - 50 members</option>
                    <option value="50-200">50 - 200 members</option>
                    <option value="200-1000">200 - 1,000 members</option>
                    <option value="1000+">1,000+ members</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Organization Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your organization's mission, events, or academic focus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Logo / Brand Upload Mock */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Organization Logo & Branding
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-4 bg-slate-950/40 text-center flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 transition cursor-pointer">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-xs text-slate-300 font-medium">Click to upload SVG, PNG, or JPG</span>
                  <span className="text-[10px] text-slate-500 font-mono">Max size 2MB (Default badge will be generated if skipped)</span>
                </div>
              </div>

              {/* Location (City & Country) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>City / Campus</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad or Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Country</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Role Info Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Automatic RBAC Assignment: </span>
                  As creator, you will automatically be assigned the <span className="font-mono font-bold text-white">ORGANIZATION_ADMIN</span> role. You can invite Event Admins, Coordinators, and Judges once the workspace is provisioned.
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/workspace"
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                >
                  <span>{isSubmitting ? "Provisioning Organization..." : "Create Organization"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        EVENTOPS Multi-Tenant Architecture • Zero Paperwork Guarantee
      </footer>
    </div>
  );
}
