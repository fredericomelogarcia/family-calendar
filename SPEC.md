# Family Calendar App — SPEC.md

> **KinCal** — A warm, mobile-first family calendar PWA that keeps your household in sync.

---

## 1. Concept & Vision

**KinCal** is a cozy yet professional shared calendar for small family units (max 3 users). It feels like a warm kitchen wall calendar upgraded for the digital age — inviting, scannable at a glance, and deeply personal. The design balances warmth (soft shadows, rounded edges, earthy tones) with crisp professionalism (sharp typography, purposeful whitespace). It's the difference between a calendar that's *on* the wall and one that *belongs* to the wall.

The experience prioritizes mobile-first scanning — a parent checking tomorrow's schedule in 5 seconds — while offering richer interactions on larger screens.

---

## 2. Design Language

### Aesthetic Direction
**"Warm Modern"** — Scandinavian-inspired warmth meets clean SaaS professionalism. Think Notion's clarity with Hearth's coziness. Organic shapes soften hard data; muted earth tones invite daily use without visual fatigue.

### Color Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Warm Cream | `#FAF9F7` | Page backgrounds |
| Surface | Soft White | `#FFFFFF` | Cards, modals |
| Surface Alt | Muted Sand | `#F5F3EF` | Secondary backgrounds |
| Primary | Sage Green | `#7C9A7E` | Primary actions, selected states, event dots |
| Secondary | Dusty Terracotta | `#C4857A` | Secondary accents, user avatars |
| Accent | Muted Gold | `#D4A853` | Highlights, notifications |
| Text Primary | Warm Charcoal | `#2D2A28` | Headlines, body text |
| Text Secondary | Warm Gray | `#6B6560` | Captions, metadata |
| Text Tertiary | Light Warm Gray | `#A09A94` | Placeholders, disabled |
| Border | Soft Sand | `#E8E4DE` | Dividers, card borders |
| Error | Soft Coral | `#D97B6C` | Error states |
| Success | Moss Green | `#6B8E6B` | Confirmations |

### Typography

**Headings:** `Nunito` (Google Fonts)
- Weight: 700 for page titles, 600 for section headers
- Rounded terminals feel approachable, not childish

**Body:** `Inter` (Variable — yes, we know, but it's the best for UI readability)
- Weight: 400 for body, 500 for emphasis, 600 for labels
- Exception to the "never use Inter" rule — this is a utility app, not a brand showcase

**Monospace (dates/times):** `JetBrains Mono`
- Used sparingly for time displays and date numbers

### Spatial System

- Base unit: `4px`
- Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Border radius: `8px` (small), `12px` (medium/cards), `16px` (large/buttons), `9999px` (pills/avatars)
- Shadow: `0 2px 8px rgba(45, 42, 40, 0.06)` (soft), `0 4px 16px rgba(45, 42, 40, 0.1)` (elevated)

### Motion Philosophy

**Purposeful and subtle** — motion communicates state, not decoration.

- Page transitions: `300ms ease-out` fade + slight Y translate
- Hover states: `150ms ease` scale/color shifts
- Modal entry: `200ms spring` scale from 0.95 + opacity
- Calendar date changes: `250ms` horizontal slide
- Micro-interactions: `100ms` immediate feedback

### Visual Assets

**Icons:** Phosphor Icons (regular weight) — friendly, consistent, extensive coverage for calendar/event needs.

**Imagery:** Abstract geometric patterns using the color palette for empty states. No photos — keeps it generic enough for any family.

**Decorative Elements:**
- Subtle grain texture overlay (`opacity: 0.02`) on backgrounds
- Soft gradient orbs in hero/empty states using palette colors
- Rounded container shapes throughout

---

## 3. Layout & Structure

### Information Architecture

```
/ (Dashboard - Default landing after auth)
├── /calendar (Full calendar view with view toggle)
├── /events/new (Create event flow)
├── /events/[id] (Event detail/edit)
└── /settings (Family management, profile)
```

### Page Structure

#### Dashboard (Mobile-First)
1. **Header** — App name, user avatar, add-event FAB
2. **Date Carousel** — Horizontally scrollable "today + next 7 days" for quick scanning
3. **Today's Events** — Vertical list with time, title, assigned family member
4. **This Week Preview** — Next 3-4 events condensed
5. **Quick Add** — Inline event creation from dashboard

#### Calendar View
1. **View Toggle** — Month / Week toggle pill buttons
2. **Month View** — Traditional grid, events as colored dots/badges
3. **Week View** — 7-column time grid with all-day + hourly slots
4. **Event Preview** — Tap date/event to see quick preview modal

#### Event Creation
1. Title input
2. Date picker (single day or date range)
3. Time picker (optional, defaults to all-day)
4. Assign to family member(s)
5. Optional notes
6. Color/category tag

### Responsive Strategy

- **Mobile (< 640px):** Single column, stacked layouts, bottom navigation
- **Tablet (640px - 1024px):** Two-column dashboard (today's events + calendar sidebar)
- **Desktop (> 1024px):** Sidebar navigation, three-column dashboard, expanded calendar

### Visual Pacing

- Dashboard: Dense information, tight spacing
- Calendar: Generous whitespace around the grid, breathing room
- Event modals: Centered, card-like, lots of internal padding

---

## 4. Features & Interactions

### Authentication (Clerk)

**Sign Up Flow:**
1. User enters email or uses OAuth (Google/Apple)
2. Creates account with name
3. On first login: "Create or Join a Family"
   - **Create Family:** Generates invite code (6 characters, uppercase alphanumeric)
   - **Join Family:** Enter existing invite code
4. Family creator becomes admin (can invite/remove members)
5. Max 3 members enforced at family creation and invite acceptance

**Sign In Flow:**
- Magic link email or OAuth
- Redirects to dashboard on success

**Session Handling:**
- Protected routes redirect to sign-in
- Family context stored in URL `/family/[familyId]`
- User can only access their family data

### Dashboard Interactions

| Element | Action | Result |
|---------|--------|--------|
| Date chip (carousel) | Tap | Navigate to that day's events, highlight in calendar |
| Event card | Tap | Open event detail modal |
| Event card | Long press | Quick edit options (edit/delete) |
| FAB (floating action button) | Tap | Open event creation modal |
| "View All" link | Tap | Navigate to calendar with date selected |

### Calendar Interactions

| Element | Action | Result |
|---------|--------|--------|
| Month cell | Tap | Show day's events preview (bottom sheet on mobile, popover on desktop) |
| Week time slot | Tap | Create event starting at that time |
| Event badge | Tap | Open event detail modal |
| View toggle | Tap | Animate transition between Month/Week |
| Swipe (week view) | Horizontal drag | Navigate to prev/next week |
| Month header arrows | Tap | Navigate prev/next month |

### Event Creation Flow

1. **Modal Entry** — Slide up from bottom (mobile) or center modal (desktop)
2. **Title** — Autofocus, placeholder "Event title"
3. **Date Selection** — Default to today, show calendar picker
4. **Time (optional)** — Toggle on for specific time, default all-day
5. **Assignees** — Multi-select avatars of family members
6. **Category** — Color tag selection (6 preset colors)
7. **Notes** — Optional textarea
8. **Save** — Primary button, validates required fields
9. **Success** — Toast notification, modal closes, calendar/dashboard updates

**Validation:**
- Title required (min 2 characters)
- At least one date required
- At least one assignee required (the creator)

**Error Handling:**
- Inline field errors below inputs
- Toast for server errors with retry option

### Event Detail/Edit

- Same modal as creation, pre-filled
- Delete button (with confirmation dialog)
- "Last edited by [name] [timestamp]" footer

### Settings

- **Profile:** Name, email, avatar (uploaded or initials fallback)
- **Family:** Family name (editable by admin), member list, invite code display/regenerate
- **Notifications:** Toggle email/push reminders (future feature placeholder)
- **Sign Out:** Clerk sign-out, redirects to landing

### PWA Features

- **Install prompt** on first visit (custom banner after 2 sessions)
- **Offline support** — View cached events, queue creates/edits for sync
- **Push notifications** — Event reminders (future feature)
- **App icon** — KinCal logo (initial "K" in sage green on cream background)
- **Splash screen** — Matching cream/sage theme

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| No events today | "Nothing planned — tap + to add something!" with soft illustration |
| All 3 family members assigned | All avatars shown in event badge |
| Event spans multiple days | Shown on each day in month view, connected style in week view |
| Past event creation | Allowed (for logging past activities) |
| Family invite code expired | "This code has expired. Ask your family admin for a new one." |
| Offline + event create | Queue locally, show "Pending sync" badge, auto-retry when online |

---

## 5. Component Inventory

### Navigation Components

**Bottom Navigation (Mobile)**
- 4 items: Dashboard (home icon), Calendar (calendar icon), Add (+ floating center), Settings (gear icon)
- Active state: Sage green icon + text, subtle top border
- Inactive: Warm gray icon + text

**Sidebar Navigation (Desktop)**
- Vertical stack with icons + labels
- Same items as mobile
- KinCal wordmark at top with logo

### Date Display Components

**Date Chip (Carousel)**
- States: Default (cream bg), Today (sage bg, white text), Selected (light sage bg, dark text), Has Events (green dot indicator)
- Shows: Day abbreviation (Mon), Day number (13)
- Size: 48x64px touch target

**Month Grid Cell**
- States: Default, Today (bold ring), Selected (sage fill), Other Month (muted text), Has Events (dot badges)
- Size: Fills container width on mobile (7 columns)

**Week View Row**
- Time gutter on left (6am, 12pm, etc.)
- 7 day columns, current time indicator line
- Event blocks span rows based on duration

### Event Components

**Event Card (Dashboard List)**
- Left: Time or "All Day" badge, colored left border by category
- Center: Event title, assignee avatars
- Right: Chevron for detail (mobile) or tap anywhere
- Height: Auto, min 56px

**Event Badge (Calendar)**
- Compact: Single color dot if multiple events
- Expanded: Title truncated, first assignee avatar
- Max 3 events shown, "+N" overflow indicator

**Event Modal (Create/Edit)**
- Header: "New Event" or event title + close button
- Body: Form fields stacked
- Footer: Cancel (ghost) + Save (primary) buttons
- Width: 100% mobile (sheet), 480px max desktop

### Input Components

**Text Input**
- States: Default, Focused (sage border), Error (coral border + message), Disabled (muted)
- Height: 48px
- Border radius: 8px

**Date Picker**
- Inline calendar grid (month view)
- Today highlighted, selected date in sage
- Month/year header with arrow navigation

**Time Picker**
- Native time input (mobile) or custom scroll picker (desktop)
- Shows selected time in 12-hour format with AM/PM

**Avatar Selector**
- Horizontal row of circular avatars (40px)
- Multi-select (ring on selected, checkmark overlay)
- Max 3 shown (family limit)

**Color Tag Selector**
- 6 color circles (24px) in a row
- Selected: Scale 1.1 + checkmark
- Colors: Sage, Terracotta, Gold, Blue, Purple, Coral

### Feedback Components

**Toast Notification**
- Position: Bottom center (mobile), bottom right (desktop)
- Types: Success (moss green icon), Error (coral icon), Info (sage icon)
- Auto-dismiss: 4 seconds
- Swipe to dismiss

**Loading States**
- Skeleton: Pulsing sand-colored rectangles matching content shape
- Spinner: Sage green circular spinner (for actions)
- Progress: Linear bar (for larger operations)

**Empty State**
- Centered illustration (abstract geometric pattern in palette colors)
- Headline: "No events yet"
- Subtext: "Tap + to add your first family event"
- CTA button if applicable

**Confirmation Dialog**
- Centered modal, 320px max width
- Icon (warning for destructive actions)
- Title + description
- Cancel (ghost) + Confirm (danger red for delete, primary for others)

---

## 6. Technical Approach

### Stack

- **Framework:** Next.js 16 (App Router) — 400% faster dev startup, 50% faster rendering
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + custom design tokens
- **Animation:** Framer Motion (for complex transitions) + CSS transitions (simple states)
- **Auth:** Clerk (sign-in, user management, middleware protection)
- **Database:** SQLite via Better-SQLite3 (simple, file-based, perfect for small family apps)
- **ORM:** Drizzle ORM (type-safe, lightweight)
- **Calendar Logic:** date-fns (tree-shakeable date manipulation)
- **Icons:** Phosphor React

### Project Structure

```
family-calendar/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                  # PWA icons
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── sign-up/[[...sign-up]]/
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── calendar/
│   │   │   ├── events/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx            # Redirect to dashboard or landing
│   ├── components/
│   │   ├── ui/                 # Base components (Button, Input, Modal)
│   │   ├── calendar/           # Calendar-specific (MonthGrid, WeekView)
│   │   ├── events/             # Event-specific (EventCard, EventModal)
│   │   └── layout/             # Navigation, Header, Footer
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   └── index.ts        # DB connection
│   │   ├── clerk.ts            # Clerk client/server utilities
│   │   └── utils.ts            # Shared utilities (cn, date helpers)
│   └── styles/
│       └── globals.css         # Tailwind + custom properties
├── drizzle/
│   └── migrations/
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Data Model (Drizzle Schema)

```typescript
// Users (managed by Clerk, extended with family data)
users = {
  id: text (Clerk user ID),
  familyId: text (nullable until joined),
  role: text ('admin' | 'member'),
  createdAt: timestamp
}

// Families
families = {
  id: text (cuid),
  name: text,
  inviteCode: text (unique, uppercase, 6 chars),
  createdAt: timestamp,
  updatedAt: timestamp
}

// Events
events = {
  id: text (cuid),
  familyId: text (FK),
  title: text,
  startDate: date,
  endDate: date (nullable, same as startDate for single-day),
  allDay: boolean (default true),
  color: text (category hex),
  notes: text (nullable),
  createdBy: text (FK users),
  updatedBy: text (FK users),
  createdAt: timestamp,
  updatedAt: timestamp
}

// Event Assignees (many-to-many)
event_assignees = {
  eventId: text (FK events),
  userId: text (FK users),
  PRIMARY KEY (eventId, userId)
}
```

### API Routes (Next.js Route Handlers)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/family` | Get current user's family |
| POST | `/api/family` | Create family (if none) |
| PATCH | `/api/family` | Update family name |
| POST | `/api/family/invite` | Generate new invite code |
| POST | `/api/family/join` | Join family with code |
| DELETE | `/api/family/leave` | Leave family |
| GET | `/api/events` | List events (query: start, end, userId) |
| POST | `/api/events` | Create event |
| PATCH | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |

### Clerk Integration

- **Middleware:** Protect all `/(protected)` routes, redirect to sign-in
- **User Sync:** Sync Clerk user creation to local users table
- **Organization:** Use Clerk's Organization feature for family grouping, OR custom implementation
- **Invite Flow:** Custom invite code system (not Clerk org invites) for max 3 user simplicity

### PWA Configuration

**next.config.ts:**
```ts
withOffline from @ducanh2912/next-pwa
```

**manifest.json:**
```json
{
  "name": "KinCal",
  "short_name": "KinCal",
  "description": "Family calendar that keeps your household in sync",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FAF9F7",
  "theme_color": "#7C9A7E",
  "icons": [...]
}
```

---

## 7. Non-Functional Requirements

- **Performance:** First Contentful Paint < 1.5s on mobile 3G
- **Accessibility:** WCAG 2.1 AA, keyboard navigable, screen reader friendly
- **SEO:** PWA manifest enables "Add to Home Screen" discoverability
- **Privacy:** All data per-family, no cross-family visibility, Clerk handles auth securely
- **Offline:** Core viewing works offline; writes queued for sync

---

## 8. Future Considerations (Out of Scope for v1)

- Push notifications for reminders
- Recurring events
- Event attachments (images, files)
- Color themes per family
- iCal export/import
- Mobile apps (React Native wrapper)
- Guest access (share a single event publicly)

---

## Appendix: Implementation Order

1. **Project Setup** — Next.js, Tailwind, Drizzle, Clerk integration
2. **Auth Flow** — Sign-up, sign-in, family create/join with invite codes
3. **Database Schema** — Users, Families, Events tables with relationships
4. **Dashboard** — Date carousel, event list, empty states
5. **Calendar Views** — Month grid, week grid, navigation
6. **Event CRUD** — Creation modal, detail view, editing, deletion
7. **PWA Setup** — Manifest, icons, offline support
8. **Polish** — Animations, edge cases, loading states, error handling