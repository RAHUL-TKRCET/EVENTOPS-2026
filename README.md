# EVENTOPS-2026

Hackathon project 2026 (VISTERA 2026) - Comprehensive Event Operations and Hackathon Management Platform.

## 🚀 Overview

EventOps is an end-to-end event management and real-time operations platform designed for hackathons and academic events like VISTERA 2026. It provides authenticated access across 9 administrative and participant roles, live QR code check-in with camera integration, multi-track round evaluations, automated judge allocations, and real-time analytics.

## ✨ Key Features

- **Authenticated Role-Based Portals**:
  - Super Admin (`/super-admin`)
  - Event Admin (`/events`)
  - Coordinator (`/events/[eventId]/coordinators`)
  - Track Lead (`/rounds`)
  - Judge (`/judge`, `/judge/teams`)
  - Volunteer (`/volunteer/checkin`, `/scanner`)
  - Mentor (`/mentor/requests`)
  - Sponsor (`/sponsor/portal`)
  - Participant (`/participant/portal`)
- **Zero-Trust Role Authentication**: Secure credential validation with email and password checking, preventing unauthorized role bypass.
- **Hardware-Accelerated QR Scanner & Camera Integration**: Real-time camera feed access via `navigator.mediaDevices.getUserMedia` with fallback barcode detection and participant verification.
- **Judge & Round Evaluation**: Dynamic multi-criteria scoring rubrics, real-time leaderboards, and judge assignment matrix.
- **Auditing & Activity Tracking**: Built-in security audit logs tracking check-ins, scores, evaluations, and administrative interventions.
- **High Availability & Safe Fallbacks**: Defensive data architecture with zero-crash fallbacks ensuring resilience during network or database anomalies.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **UI & Styling**: Tailwind CSS, Lucide Icons
- **Language**: TypeScript
- **Runtime**: Node.js

## 🏁 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18.x or later).

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Credentials & Access

Use the authenticated login portal at `/login` with valid role credentials.
