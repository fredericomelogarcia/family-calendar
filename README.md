# 📅 Zawly Family Calendar

Zawly is a modern, collaborative family calendar application designed to help families synchronize their schedules effortlessly. It provides a shared space where family members can coordinate events, manage recurring appointments, and keep everyone in the loop.

## ✨ Features

### 👥 Family Management
- **Create & Join:** Easily start a new family circle or join an existing one using a unique 6-character invite code.
- **Email Invitations:** Send formal invitations to family members via email (powered by Resend).
- **Role-Based Access:** Support for `Admin` (family creators) and `Member` roles.
- **Member Limits:** Optimized for small groups with a maximum limit of 6 members per family.

### 🗓️ Collaborative Calendar
- **Shared Events:** Create, edit, and manage events that are instantly visible to all family members.
- **Smart Recurrence:** Support for complex event repetition (Daily, Weekly, Monthly, Yearly).
- **Granular Deletion:** 
  - Delete a single occurrence of a recurring event without affecting the series.
  - Delete an event and all its future occurrences.
- **Intuitive Interface:** A responsive layout featuring a month-grid overview and a detailed day-view.

### 🔐 Security & Performance
- **Authentication:** Robust user management and secure sessions via Clerk.
- **Optimized Database:** High-performance PostgreSQL queries using Drizzle ORM.
- **Edge-Ready:** Built with Next.js 16 App Router for fast load times and seamless transitions.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Authentication:** [Clerk](https://clerk.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Emails:** [Resend](https://resend.com/)
- **Icons:** [Phosphor Icons](https://phosphor.icons/)
- **Date Manipulation:** [date-fns](https://date-fns.org/) & [rrule](https://rrule.js.org/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- A PostgreSQL database (Supabase recommended)
- Clerk Account
- Resend Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd family-calendar
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgres://...

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...

   # Email (Resend)
   RESEND_API_KEY=re_...
   FROM_EMAIL=invites@yourdomain.com

   # App Config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Migration**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

---

## 🏗️ Architecture Overview

The project follows a clean separation between server and client components:

- **`src/proxy.ts`**: Centralized middleware handling authentication and route protection.
- **`src/app/api/`**: RESTful endpoints for event manipulation, family management, and invitation logic.
- **`src/app/(protected)/`**: The core application logic, wrapped in protected layouts that ensure users are authenticated and belong to a family.
- **`src/lib/db/`**: Schema definitions and database client configuration using Drizzle.
- **`src/components/`**: A modular UI library including high-performance calendar grids and reusable form components.

## 📜 License
MIT
