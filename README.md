# 🇱🇰 Help Sri Lanka - Disaster Relief Coordination Platform

**Help Sri Lanka** is a rapid-response disaster relief web application connecting affected communities with relief donors across Sri Lanka during flood, landslide, and monsoon emergencies.

[Deployed on Netlify]([https://vercel.com](https://app.netlify.com)
[Database](https://supabase.com)
[React](https://reactjs.org/)
[Tailwind CSS](https://tailwindcss.com/)

---

##  Project Overview

During natural disasters in Sri Lanka, coordinating resource distribution and pinpointing urgent civilian needs are critical challenges. **Help Sri Lanka** acts as a centralized digital relief bridge:
1. **Victims / Affected Individuals**: Can submit urgent relief requests (food, dry rations, clean drinking water, rescue assistance, medical aid) directly through the Help Sri Lanka platform.
2. **Donors & Relief Organizations**: Can pledge in-kind relief consignments, specify supplies and quantities, and coordinate designated drop-off logistics.
3. **Public Transparency & Tracking**: The Help Sri Lanka Live Listings page allows citizens and volunteers to monitor incoming aid pledges, active relief requests, and community impact in real time.
4. **Community Feedback**: Registered users can submit reviews and operational feedback to continuously improve Help Sri Lanka's on-the-ground relief efforts.

---

##  Core Features of Help Sri Lanka

- **Interactive Landing Page**: 
  - Overview of the **Help Sri Lanka** initiative with live impact tickers (supplies mobilized, food ration packs delivered, rescue boats deployed).
  - Rapid-navigation hub to direct users to emergency requests, donation portals, and live updates.
- **User Authentication & Access Control**: 
  - Mandatory Registration & Login system ensuring security, preventing duplicate/spam requests, and maintaining a verified audit trail for all donations and aid requests.
- **In-Kind Relief Consignment Builder (Donate Submission)**:
  - Multi-category emergency supply selector (Water & Dry Rations, Medical & Hygiene).
  - Dynamic responsive quantity counters `[-] [count] [+]`.
  - Donor anonymity option and designated logistics drop-off point selection.
- **Emergency Relief Request Portal**: 
  - Dedicated portal for affected families and on-ground rescue workers to request immediate survival aid with location details.
- **Live Donation Listings & Audit Trail**: 
  - Real-time catalog of pledged consignments with status tracking (`Pending`, `Dispatched`, `Delivered`).
  - Search and filter by donor, location, or status.
- **Feedback & Review System**: 
  - Community feedback channel to submit insights and ratings on relief distribution.
- **Full CRUD Architecture**: 
  - Seamless Create, Read, Update, and Delete capabilities synchronized with cloud data persistence.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Project Name** | **Help Sri Lanka** |
| **Frontend** | React.js (Vite), Tailwind CSS, Lucide Icons |
| **Backend / API** | Node.js / Express (with Supabase BaaS Client Integration) |
| **Database** | Supabase (PostgreSQL Cloud DB with JSONB support) |
| **Authentication** | Supabase Auth / Local Session Management |
| **Deployment** | Vercel (CI/CD connected via GitHub) |
| **Version Control** | Git & GitHub |

---

## Architecture & Collaboration

**Help Sri Lanka** utilizes a shared **Supabase PostgreSQL** cloud instance. Each team member configures their local environment via `.env` to ensure a single, consistent state during collaborative development:
