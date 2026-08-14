# Evently — UI & UX Design Brief
Written against the PRD, the locked spec (PROJECT_STATE.md), and the confirmed color decision (Teal + Sidecar Yellow). This is the reference for every screen built from here on — deviations should be deliberate, not accidental.

---

## 1. Design Principles

**1. Compact over spacious.** Every screen must be usable without excessive scrolling on a standard laptop (1366×768) and a mid-size phone (375×667) without feeling cramped. This was learned the hard way on Login/Signup v1 — desktop-first spacing looked fine on a design mockup and terrible in a real browser. Default to small padding/type, scale up with `sm:`/`md:`, never the reverse.

**2. Function before flourish.** This is a tool students and faculty use repeatedly during a busy semester, not a marketing site visited once. Every visual decision should reduce the time to "find my event" or "register," not decorate the page. Animation, gradients, and decorative imagery are used only where they clarify state (loading, success) — never purely for polish.

**3. One accent color, used sparingly.** Teal is the only color allowed to mean "primary action" or "active state." The moment a second color competes for that role (a gradient hero, a second accent button color, a "fun" color per page), the UI stops teaching the user where to look. Category tag colors are the one deliberate exception, and they're constrained specifically so they never collide with Teal or the Sidecar Yellow accent.

---

## 2. Visual Direction

**Mood:** Calm, organized, slightly institutional-but-warm — closer to a well-run university portal than a startup landing page. Think "the good version of a student information system," not "event marketing app." Judges and faculty need to trust it; students need to not be bored by it.

**References (what this should feel like, not copy):**
- Linear's information density and restraint (lots of content, never cluttered)
- Notion's use of a single accent color against neutral grays
- A university's official portal, but one that was actually designed well (rare, but that's the bar)

**What to explicitly avoid:**
- Purple/indigo gradients on hero sections — this is the single most overused "AI-generated startup" tell right now, and it's exactly what an earlier pass at this project defaulted to before the color decision was made.
- Glassmorphism / heavy blur effects — trendy in 2023–24 mockups, reads as dated and unnecessary here.
- Illustrated mascot characters or generic "people at a desk" stock-style SVG illustrations — common AI-generated filler, adds nothing functional.
- Emoji used as functional icons in the shipped product (they were fine as quick placeholders during early build, but every 🔔/📅/📍 should be replaced with a real icon component — lucide-react is already in the stack, use it everywhere).
- Rounded-everything softness taken too far (e.g. `rounded-3xl` on every element) — reserve larger radii for cards/modals, keep buttons and inputs at a tighter, more precise radius.

---

## 3. Design Tokens

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#035352` (Teal) | Buttons, links, active nav state, focus rings, logo background, headers on colored sections |
| `primary-hover` | `#024342` | Button/link hover state (darker teal) |
| `primary-light` | `#E6EFEF` | Selected/active background fills (e.g. active sidebar item background) |
| `accent` | `#F3E8BC` (Sidecar Yellow) | Highlight badges, "Recommended" section backgrounds, sparing use only — never a second primary |
| `accent-text` | `#8A6D1D` | Text/icon color when placed on the accent background (needs a darker tone for contrast — raw dark-on-cream) |

**Category tag colors** — deliberately constrained so none collide with `primary` (Teal) or `accent` (Sidecar Yellow):

| Category | Hex | Note |
|---|---|---|
| Technical | `#2563EB` (Blue) | Was indigo in the old placeholder theme; changed since indigo reads too close to the old primary |
| Cultural | `#6B7280` (Grey) | Unchanged |
| Workshop | `#F97316` (Orange) | Unchanged |
| Competition | `#9333EA` (Purple) | Unchanged |
| Seminar | `#B45309` (Amber/Brown) | **Changed from teal** — teal is now the primary color, so Seminar's old tag color would visually merge with buttons/nav. This is a required fix wherever Seminar tags render. |
| Sports | `#EC4899` (Pink) | Unchanged — pink stays exclusive to this tag, never used elsewhere in the UI |
| Conference | `#475569` (Slate) | Unchanged |

**Neutrals:** standard Tailwind gray scale (`gray-50` through `gray-900`) for backgrounds, borders, and body text. No change from what's already in use.

**Semantic colors:** `red-600` (errors), `green-600` (success — used sparingly, e.g. "Registered ✓"), `amber-500` (warnings, e.g. faculty pending-approval banner — already correctly used).

### Typography

**Chosen typeface: Manrope** (Google Fonts, free).

Why: Manrope is a geometric-humanist sans with slightly rounded terminals — it reads as modern and friendly without tipping into the "startup default" territory that Inter/Poppins now occupy (both are used so widely they've become the visual shorthand for "AI-generated app"). Manrope has genuinely excellent number rendering (important — this app shows dates, semesters, group numbers, ratings constantly) and a wide weight range (200–800) that gives real hierarchy without needing a second typeface.

Load via `@import` in `index.css` or a `<link>` in `index.html`, then set as the Tailwind `fontFamily.sans` default — don't leave it as a one-off class, it should be the base font everywhere.

**Type scale** (mobile-first, matches the compact sizing already established):

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-xs` | 12px | 400/500 | Helper text, labels, timestamps |
| `text-sm` | 14px | 400/500 | Body text, input text, nav items |
| `text-base` | 16px | 400 | Default paragraph text (rarely needed given density) |
| `text-lg` | 18px | 600 | Section headers within a page |
| `text-xl` | 20px | 700 | Page titles on compact screens (e.g. Signup heading) |
| `text-2xl` | 24px | 700 | Page titles on standard screens (e.g. Login "Welcome back") |
| `text-3xl` | 30px | 700 | Reserved for large stat numbers on dashboards only |

### Spacing Scale
Standard Tailwind scale, but with a **compact default policy**: default to `2`/`3`/`4` (8/12/16px) for internal component spacing, reserve `6`/`8` (24/32px) for separating major page sections only. This is already the pattern established in Login/Signup v2 — carry it forward to every new screen without renegotiating it each time.

### Radius
- Inputs/buttons/pills: `rounded-lg` (8px) — precise, not soft
- Cards: `rounded-2xl` (16px) — the one place a larger radius is intentional, gives cards a distinct "container" feel
- Avatars/icon badges: `rounded-full` or `rounded-lg` depending on shape (circular avatars, square logo mark)

### Shadows
- Cards at rest: `shadow-sm` (barely-there, just enough separation from background)
- Cards that need emphasis (auth cards, modals): `shadow-xl shadow-gray-200/50` — already established, keep it
- No shadow on buttons at rest; add `hover:shadow-lg hover:shadow-primary/20` on primary buttons only (teal-tinted glow, not generic gray)

---

## 4. Screen Inventory

| Screen | Purpose | Status |
|---|---|---|
| Login | Authenticate existing users | ✅ Built |
| Student Signup | Create student account, BIC/Herald/Fishtail/Guest branching | ✅ Built |
| Faculty Signup | Create faculty account, pending admin approval | Not built |
| Student Dashboard | Home base for students — stats, upcoming events, recommendations | Not built |
| Browse Events | Search/filter/discover all events | Not built |
| Event Detail | Full info on one event, register entry point, feedback view | Not built |
| Registration | Complete registration for a specific event | Not built |
| My Registered Events | Student's own registration history + feedback entry point | Not built |
| Feedback Form | Dynamic per-event feedback, student-facing | Not built |
| Faculty Dashboard | Home base for faculty — their events, quick actions | Not built |
| Create Event | Faculty event creation form | Not built |
| Feedback Builder | Faculty builds the dynamic feedback form for an event | Not built |
| Admin Dashboard (MVP: approvals only) | Faculty approval queue | Not built |
| *(v2)* Faculty Event Management, Admin Event Management, Admin User Management, Gallery (student/faculty), Profile (student/faculty) | Deferred per PRD Section 5 | Not built |

---

## 5. User Flows

**Flow A — New student discovers and registers for an event**
1. Land on Login → click "Sign up here" → Student Signup
2. Enter details, type college name → cascade appears (or Guest fallback) → submit → redirected to Login
3. Log in → land on Student Dashboard
4. Click "Browse Events" in sidebar → search/filter → find event
5. Click event card → Event Detail page → click "Register Now"
6. Registration page → confirm/edit details → submit → redirected to Event Detail, button now shows "Registered ✓"

**Flow B — Faculty creates an event and builds feedback**
1. Faculty Signup → pending approval banner shown → (admin approves, out of this flow) → Login succeeds
2. Land on Faculty Dashboard → click "Create New Event"
3. Fill event form, upload images → submit → redirected to Faculty Dashboard, new event appears in list
4. Click the new event → (v2: Faculty Event Management) → "Create Feedback Form" → Feedback Builder → add questions → save

**Flow C — Student gives feedback after attending**
1. My Registered Events → find past event → click "Give Feedback" (only enabled if not already submitted)
2. Feedback Form page → star rating (always shown) + organizer's custom questions → submit → button becomes disabled "Feedback Submitted ✓" on return to My Registered Events

**Flow D — Admin approves faculty**
1. Login as admin → Admin Dashboard → Pending Faculty Approvals list
2. Click Approve/Reject on a row → row disappears from pending list (or moves to approved, MVP just needs the disappear-on-action behavior)

---

## 6. Per-Screen Layout

**Student Dashboard**
- Sections top-to-bottom: TopBar (bell + avatar) → Welcome header + role badge → Stats row (3 cards) → Upcoming/Past tab toggle → Event card grid (2-col) → Recommended For You (2×2 grid) → sidebar-adjacent right column: mini calendar + recent notifications.
- Primary action: none singular — this is a hub, primary actions live on the cards themselves (View Details / Register).
- Components: StatCard, EventCard, TabToggle, MiniCalendar, NotificationListItem.

**Browse Events**
- Sections: TopBar → Search bar → Category pill row (horizontal scroll on mobile) → Secondary filter row (Sort/Date/Community/Reset, collapses to a "Filters" button + drawer on mobile) → Results count → Event card grid → Pagination controls.
- Primary action: Search bar is the primary interaction; Register Now on each card is the primary action per-item.
- Components: SearchInput, CategoryPill, FilterBar, EventCard, Pagination.

**Event Detail**
- Sections: TopBar → Header (title, pills, Register button) → Info grid (4 items: Date/Time/Location/Organizer) → Tab bar (Details/Gallery/Feedback) → Tab content.
- Primary action: Register Now (in header, sticky-ish on scroll if time allows).
- Components: TabBar, InfoGridItem, FeedbackSummaryBar, ReviewListItem.

**Registration**
- Sections: TopBar → Header → Event summary box (read-only) → Personal Information (branches by BIC/Guest) → Team Information (optional textarea) → Agreement checkbox → Cancel/Register buttons.
- Primary action: Register Now button, full-width, bottom of form.

**Faculty Dashboard**
- Sections: TopBar → Welcome header + info chip row (Department/Faculty ID/Status) → Stats row (2 cards) → My Recent Events list → Quick Actions card (3 buttons).
- Primary action: "Create New Event" — should be visually the most prominent button on the page (primary teal, not a secondary/outline style).

**Create Event**
- Sections: TopBar → Basic Information → Date & Time → Event Details (org dept/community, rules, max participants) → Image upload zone → Cancel/Create buttons.
- Primary action: Create Event, sticky at bottom on mobile if the form is long enough to require it.

---

## 7. Component Library

| Component | Variants | States |
|---|---|---|
| **Button** | Primary (teal fill), Secondary (outline, gray border), Danger (red, for reject/delete actions) | Default, hover, active/pressed, disabled, loading (spinner replaces icon) |
| **Input (text)** | With left icon, without icon | Default, focus (teal ring), error (red border + message below), disabled |
| **Select/Dropdown** | Standard, disabled-until-parent-selected (cascade pattern) | Default, focus, disabled, disabled-with-tooltip-reason (optional nice-to-have) |
| **EventCard** | Grid variant (Dashboard/Browse), List variant (v2, not needed for MVP) | Default, registered (badge + disabled button), completed (badge, no button), hover (subtle shadow lift) |
| **CategoryPill** | One per category (7 total, per token table above) | Static — no interactive states needed, display-only |
| **StatusPill** | Upcoming, Ongoing, Completed, Cancelled, Pending (faculty approval) | Static |
| **TabBar** | Underline-style (Event Detail), Pill-style (Signup Student/Faculty toggle) | Active, inactive, hover |
| **Sidebar Nav Item** | — | Default, active (teal-light background + teal text), hover |
| **TopBar Bell** | — | No unread (plain), unread (red badge with count) |
| **Toast/Banner** | Info (blue), Success (green), Warning (amber — used for faculty pending), Error (red) | Appears, auto-dismiss (if used for toasts), persistent (if used as inline banner) |
| **Modal** | Confirmation (e.g. "Cancel registration?") | Open, closing animation, backdrop click to dismiss |
| **EmptyState** | Per-screen custom message + icon | — |

---

## 8. States (empty / loading / error / success / offline)

**Browse Events**
- Empty: "No events match your filters" + illustration-free icon (e.g. a search icon, muted gray) + "Reset Filters" button.
- Loading: skeleton cards (gray pulse blocks matching EventCard shape) — not a spinner, skeletons feel faster for grid content.
- Error: inline banner "Couldn't load events. Try again." + retry button.
- Success: normal grid render.

**Event Detail**
- Loading: skeleton for header + info grid.
- Error (event not found / deleted): full-page message, not a toast — "This event doesn't exist or has been removed" + link back to Browse Events.

**Registration**
- Loading (submitting): button shows spinner, disabled, text changes to "Registering...".
- Error (already registered): inline banner above the form, not a toast — this needs to be seen, not missed.
- Success: redirect to Event Detail with a brief success toast ("You're registered!") rather than a separate success page — keeps the flow fast.

**Feedback Form**
- Empty (no form built yet by faculty): "Feedback isn't open for this event yet" — student sees this instead of a broken form if they navigate here before faculty builds it.
- Success: redirect to My Registered Events, that event's button becomes "Feedback Submitted ✓".

**Dashboard (any role)**
- Loading: skeleton stat cards + skeleton event cards.
- Empty (new user, no events yet): friendly message per section ("You haven't registered for anything yet — browse events to get started" with a button straight to Browse Events), not just a blank grid.

**Offline:** given this is a local/campus web app with no offline-first requirement in the PRD, offline handling is minimal — a generic "Connection lost" banner triggered by a failed API call is sufficient; no service worker or offline caching needed for MVP.

---

## 9. Responsive Behaviour

**Mobile (< 640px, default/base Tailwind classes):**
- Single column everywhere. Sidebar becomes a bottom nav bar or hamburger-triggered drawer (recommend hamburger drawer, matches the "sidebar" mental model better than reinventing as bottom tabs given time constraints).
- Event grids: 1 column.
- Filter rows: collapse into a single "Filters" button that opens a bottom sheet/drawer.
- Forms: all fields full-width, stacked (already the pattern via `grid-cols-1 sm:grid-cols-2`).

**Tablet (640px–1024px, `sm:`/`md:`):**
- Event grids: 2 columns.
- Sidebar: can remain a drawer, or become a persistent narrow icon-only rail if time allows (optional polish, not MVP-critical).
- Forms: 2-column field pairs as already built.

**Desktop (1024px+, `lg:` and up):**
- Sidebar: persistent, full-width with labels (already built in `Sidebar.jsx`).
- Event grids: can go to 3 columns on very wide screens (`lg:grid-cols-3`) — worth adding once Browse Events is built, wasn't needed on auth pages.
- Max content width: cap the main content area (not the sidebar) around `max-w-6xl` or `max-w-7xl` so text/cards don't stretch uncomfortably wide on large monitors.

---

## 10. Accessibility

**Contrast ratios:**
- Teal (`#035352`) on white: passes AA and AAA for normal text (very dark teal, high contrast) — safe for body text use, not just large headings.
- White text on Teal button background: passes AA comfortably.
- Sidecar Yellow (`#F3E8BC`) is very light — **never use it as a background behind white or light-gray text**; always pair with the dark `accent-text` (`#8A6D1D`) or near-black text on top of it.
- Category tag colors: all currently used as pill backgrounds with white text — Cultural (`#6B7280`) and Slate/Conference (`#475569`) are borderline; test these two specifically with a contrast checker before shipping, may need white text at `font-medium` weight minimum to stay legible at small pill sizes.

**Focus order:** form fields should follow visual top-to-bottom, left-to-right reading order (already naturally true given the grid layout, but worth explicitly checking once Faculty Signup's Department→Designation cascade is built, since dynamically-appearing fields can sometimes break tab order if not careful).

**Keyboard navigation:**
- All buttons/links must be reachable and activatable via Tab + Enter/Space — native `<button>`/`<a>` elements already handle this correctly as long as custom clickable `<div>`s are avoided (check EventCard's action buttons specifically when built).
- Dropdowns (native `<select>`) already support keyboard navigation for free — no custom dropdown component needed, which also simplifies accessibility work.
- Modal (when built for v2 confirmation dialogs): must trap focus while open and return focus to the triggering element on close.

**ARIA needs:**
- Password show/hide toggle buttons need `aria-label="Show password"` / `"Hide password"` (currently just an icon with no label — should be added).
- Notification bell badge count needs `aria-label` announcing the count, e.g. `aria-label="3 unread notifications"`.
- Category pills and status pills are decorative-but-informative — fine as plain text-in-a-span, no special ARIA needed since the text itself is already readable by screen readers.
- Cascading selects (Faculty Signup, Student Signup academic cascade) should use `aria-disabled` alongside the native `disabled` attribute isn't necessary (native disabled is sufficient and already correctly announced by screen readers) — no extra work needed here, just confirming the existing pattern is fine.

---

## Immediate action items from this brief

1. Update `tailwind.config.js` with the finalized Teal/Sidecar Yellow tokens (replacing the old indigo placeholder scale).
2. Retroactively fix Login and Student Signup to use the new tokens instead of `indigo-*` classes.
3. Add Manrope font to the project.
4. Fix the Seminar category tag color (teal → amber/brown) wherever category color logic is defined — currently only exists as a plan in `EventCard.jsx`'s color map from the original scaffold, hasn't been rebuilt with real data yet, so this is a clean fix with no rework needed.
5. Add `aria-label`s to the two password toggle buttons already built.
