export const analyticsApi = {
  async getOverviewMetrics() {
    await new Promise((r) => setTimeout(r, 200));
    return {
      attendanceTrends: [
        { time: "08:00 AM", count: 18 },
        { time: "09:00 AM", count: 64 },
        { time: "10:00 AM", count: 98 },
        { time: "11:00 AM", count: 114 },
        { time: "12:00 PM", count: 116 },
      ],
      judgeWorkloads: [
        { judge: "J001 (MIT)", assigned: 6, max: 8 },
        { judge: "J002 (DeepMind)", assigned: 6, max: 8 },
        { judge: "J007 (BioGen)", assigned: 8, max: 8 }, // 100%
        { judge: "J012 (Station F)", assigned: 7, max: 8 },
        { judge: "J018 (Siemens)", assigned: 4, max: 8 },
      ],
      domainDistribution: [
        { name: "AI/ML", value: 28, color: "#6366f1" },
        { name: "Distributed/Web3", value: 20, color: "#8b5cf6" },
        { name: "FinTech", value: 18, color: "#ec4899" },
        { name: "HealthTech", value: 16, color: "#10b981" },
        { name: "IoT/Robotics", value: 14, color: "#f59e0b" },
        { name: "CleanTech", value: 12, color: "#06b6d4" },
        { name: "CyberSec", value: 12, color: "#ef4444" },
      ],
      roundScores: [
        { range: "90-100", count: 18 },
        { range: "80-89", count: 52 },
        { range: "70-79", count: 36 },
        { range: "<70", count: 14 },
      ],
      resourceConsumption: [
        { name: "Lunch Boxes", total: 650, consumed: 412 },
        { name: "Cold Brew/Drinks", total: 1200, consumed: 980 },
        { name: "Dev Hardware Kits", total: 30, consumed: 28 },
        { name: "NFC Badges", total: 600, consumed: 495 },
      ],
    };
  },
};
