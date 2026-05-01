# Zawly

Zawly is a modern, collaborative family workspace designed to help families coordinate schedules and household expenses. It provides a shared space where family members can manage recurring appointments, keep everyone in the loop, and understand the monthly spending plan.

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

### Household Expenses
- **Income & Expenses:** Track recurring income and household costs in one shared place.
- **Category Targets:** Set monthly targets for groceries, bills, transport, childcare, savings, and more.
- **Monthly Totals:** See income, spending, and what is left this month.
- **Search & Filters:** Quickly find expenses by description, amount, or category.

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
