"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { venuesApi } from "@/lib/api/venues";
import { Building, ArrowLeft, ArrowRight, Zap, Wifi } from "lucide-react";
import Link from "next/link";

export default function CreateVenuePage() {
  const router = useRouter();
  const [name, setName] = useState("Room 501 - Quantum & Distributed Systems Lab");
  const [building, setBuilding] = useState("Claude Shannon Lab");
  const [floor, setFloor] = useState("Floor 5");
  const [capacity, setCapacity] = useState("25");
  const [hasPower, setHasPower] = useState(true);
  const [hasInternet, setHasInternet] = useState(true);
  const [isAccessible, setIsAccessible] = useState(true);
  const [equipment, setEquipment] = useState("10Gbps Ethernet, Dual 4K Displays, 3-Phase Power");
  const [supportedDomain, setSupportedDomain] = useState("Distributed Systems / Web3");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newVenue = await venuesApi.create({
      name,
      building,
      floor,
      capacity: parseInt(capacity, 10) || 20,
      hasPower,
      hasInternet,
      isAccessible,
      equipment: equipment.split(",").map((s) => s.trim()),
      supportedDomains: [supportedDomain],
    });

    setIsLoading(false);
    router.push("/venues");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/venues"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Add New Venue Suite</h2>
          <p className="text-xs text-slate-400">
            Provision physical rooms, power ratings, and automated bench capacity.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Venue Suite Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Building / Complex"
            required
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
          />

          <Input
            label="Floor Level"
            required
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />

          <Input
            label="Total Capacity (Persons)"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />

          <Select
            label="Primary Supported Domain"
            value={supportedDomain}
            onChange={(e) => setSupportedDomain(e.target.value)}
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
            label="Specialized Equipment Tags"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            hint="Comma separated list"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hasPower}
              onChange={(e) => setHasPower(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Dedicated Power (16A)</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hasInternet}
              onChange={(e) => setHasInternet(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>High-Speed LAN/WiFi</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isAccessible}
              onChange={(e) => setIsAccessible(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>ADA Wheelchair Accessible</span>
          </label>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/venues")}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Venue & Generate Benches
          </Button>
        </div>
      </form>
    </div>
  );
}
