import { Venue, Bench } from "@/types";
import { mockVenues } from "@/lib/mock-data/venues";

export const venuesApi = {
  async getAll(eventId = "evt-01"): Promise<Venue[]> {
    await new Promise((r) => setTimeout(r, 200));
    return mockVenues.filter((v) => !eventId || v.eventId === eventId);
  },

  async getById(id: string): Promise<Venue | undefined> {
    await new Promise((r) => setTimeout(r, 150));
    return mockVenues.find((v) => v.id === id);
  },

  async create(data: Partial<Venue>): Promise<Venue> {
    await new Promise((r) => setTimeout(r, 300));
    const newId = `R${(mockVenues.length + 1).toString().padStart(3, "0")}`;
    const newVenue: Venue = {
      id: newId,
      eventId: data.eventId || "evt-01",
      name: data.name || `Room ${newId} - Innovation Hub`,
      building: data.building || "Turing Science Block",
      floor: data.floor || "Floor 1",
      capacity: data.capacity || 20,
      hasPower: data.hasPower ?? true,
      hasInternet: data.hasInternet ?? true,
      isAccessible: data.isAccessible ?? true,
      equipment: data.equipment || ["10Gbps LAN", "Monitors"],
      supportedDomains: data.supportedDomains || ["AI / Machine Learning"],
      status: "ACTIVE",
      benches: Array.from({ length: 5 }, (_, bIdx) => ({
        id: `B${(mockVenues.length * 5 + bIdx + 1).toString().padStart(3, "0")}`,
        label: `Bench ${mockVenues.length * 5 + bIdx + 1}`,
        venueId: newId,
        status: "available",
        hasPower: true,
        hasEthernet: true,
      })),
    };
    mockVenues.push(newVenue);
    return newVenue;
  },

  async updateBenchStatus(benchId: string, status: Bench["status"]): Promise<Bench> {
    await new Promise((r) => setTimeout(r, 150));
    for (const v of mockVenues) {
      const b = v.benches.find((bench) => bench.id === benchId);
      if (b) {
        b.status = status;
        return { ...b };
      }
    }
    throw new Error("Bench not found");
  },
};
