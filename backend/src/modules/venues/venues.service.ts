export interface BenchEntity {
  id: string;
  venueId: string;
  label: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  hasPower: boolean;
  hasEthernet: boolean;
  assignedTeamId?: string;
  assignedTeamName?: string;
}

export interface VenueEntity {
  id: string;
  eventId: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  hasPower: boolean;
  hasInternet: boolean;
  isAccessible: boolean;
  equipment: string[];
  supportedDomains: string[];
  status: "ACTIVE" | "FULL" | "STANDBY" | "MAINTENANCE";
  benches: BenchEntity[];
}

export const inMemoryVenues: VenueEntity[] = [
  {
    id: "R001",
    eventId: "evt-01",
    name: "Turing Computing Lab 101",
    building: "Engineering Block A",
    floor: "1st Floor",
    capacity: 40,
    hasPower: true,
    hasInternet: true,
    isAccessible: true,
    equipment: ["5GHz Wi-Fi AP", "Backup UPS Pulpit", "Ceiling Projector", "Whiteboard"],
    supportedDomains: ["AI / Machine Learning", "Distributed Systems / Web3", "CyberSecurity"],
    status: "ACTIVE",
    benches: [
      { id: "B001", venueId: "R001", label: "Bench A-01", status: "available", hasPower: true, hasEthernet: true },
      { id: "B002", venueId: "R001", label: "Bench A-02", status: "available", hasPower: true, hasEthernet: true },
      { id: "B003", venueId: "R001", label: "Bench A-03", status: "available", hasPower: true, hasEthernet: true },
      { id: "B004", venueId: "R001", label: "Bench A-04", status: "occupied", hasPower: true, hasEthernet: true, assignedTeamId: "T001", assignedTeamName: "NeuralPulse Labs" },
      { id: "B005", venueId: "R001", label: "Bench A-05", status: "occupied", hasPower: true, hasEthernet: true, assignedTeamId: "T002", assignedTeamName: "QuantumSentinel" },
    ],
  },
  {
    id: "R002",
    eventId: "evt-01",
    name: "Ada Lovelace Hardware Studio",
    building: "Engineering Block B",
    floor: "Ground Floor",
    capacity: 35,
    hasPower: true,
    hasInternet: true,
    isAccessible: true,
    equipment: ["Soldering Stations", "Oscilloscopes", "Isolated RF Enclosure"],
    supportedDomains: ["IoT & Robotics", "HealthTech & Bio"],
    status: "ACTIVE",
    benches: [
      { id: "B021", venueId: "R002", label: "Bench B-01", status: "available", hasPower: true, hasEthernet: true },
      { id: "B022", venueId: "R002", label: "Bench B-02", status: "available", hasPower: true, hasEthernet: true },
    ],
  },
];

export class VenuesService {
  public static getAll(eventId: string) {
    return inMemoryVenues.filter((v) => v.eventId === eventId);
  }

  public static getById(id: string) {
    return inMemoryVenues.find((v) => v.id === id);
  }

  public static updateBench(venueId: string, benchId: string, updates: Partial<BenchEntity>) {
    const venue = this.getById(venueId);
    if (!venue) throw new Error("Venue not found");
    const bench = venue.benches.find((b) => b.id === benchId);
    if (!bench) throw new Error("Bench not found");
    Object.assign(bench, updates);
    return bench;
  }
}
