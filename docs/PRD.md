# Evently — Product Requirements Document

**Smart Campus Event Management Platform** · NEXORA Group · SEP Web Category · Biratnagar International College (affiliated with University of Wolverhampton)

_Version 1 — written [Aug 13, 2026], target delivery Aug 20, 2026_

---

## 0. A blunt note on timeline before anything else

Your original SEP Project Proposal scoped this across **Weeks 3–8** (a 5–6 week window) with a full team of 6 actively building. The actual situation as of this document:

- **You have ~7–9 days left**, not 5–6 weeks.
- You are effectively building .
- As of today, only **Login** and **Student Signup** are fully built and tested end-to-end. Everything else — Faculty Signup, both dashboards, Browse Events, Event Detail, Registration, Feedback (dynamic builder), Notifications, Admin panel, Gallery, Profile — is not started.

This document will still lay out the full vision (because that's what a PRD is for, and because your written proposal promised specific things to the judges), but Section 5 below makes a **hard, opinionated cut** of what's realistic for Aug 20 vs. what should be explicitly framed as "designed but not built — planned for v2" in your presentation. Presenting a smaller set of features that work flawlessly will score better with judges than a large set of half-broken ones. I'd rather tell you this now than have you discover it on Aug 19.

---

## 1. Problem Statement

At BIC, event communication runs entirely through college Gmail and department-specific notice boards. This creates three concrete failures:

1. **Discovery failure** — event announcements arrive as one email among academic notices, placement alerts, and administrative mail. There is no single place a student can go to see "what's happening on campus this month."
2. **Coordination failure** — organizers manage registration and attendance through scattered Google Forms and spreadsheets, one per event, with no shared system. This means no cross-event visibility, no reusable participant data, and manual reconciliation of who actually showed up.
3. **Feedback failure** — there is no structured mechanism to collect or review post-event feedback, so organizers have no data to improve future events and no record of what worked.

The people who hurt from this: **students** miss events they'd have wanted to attend simply because the announcement was buried; **faculty/club organizers** lose hours per event doing manual registration admin instead of running the event; **admins** have no oversight of what's happening across departments without personally checking each organizer's spreadsheet.

---

## 2. Target User + 2 Personas

**Primary users:** BIC students (and students from two other Wolverhampton-affiliated Nepali colleges — Herald College Kathmandu, Fishtail Mountain College — who may attend BIC-hosted events as guests), BIC faculty/club coordinators, and BIC administrative staff.

### Persona 1 — Priya, BIC Student

- 2nd year, BSc (Hons) Computer Science, Level 5, Semester 3, Group G3.
- Checks her college Gmail maybe once a day, mostly for academic notices — event emails get lost.
- Wants: a fast way to see what's on this week, register in under a minute, get reminded before it starts.
- Frustration: found out about a hackathon the day after registration closed because the email was buried.

### Persona 2 — Suman, Faculty / IT Academics Lecturer, DevCorps Community Lead

- Runs 3–4 tech events per semester for his DevCorps community.
- Currently manages registration via a Google Form + manually cross-checks attendance on a printed list at the door.
- Wants: create an event once, have registration + reminders handled automatically, get a clean participant list, collect feedback without designing a form from scratch every time.
- Frustration: spends more time on Google Sheets admin than on the actual event content.

---

## 3. Goals and Non-Goals

### Goals

- One searchable, filterable hub for all BIC campus events.
- Self-service registration (individual or team) with confirmation.
- A faculty workflow to create events without needing IT/admin involvement each time (once approved).
- A working feedback loop: organizers define what they want to ask, students answer it, organizers can see aggregated results.
- Admin oversight: approve faculty, see everything happening across the platform, produce a report.
- A genuinely working, demoable product by Aug 20 — not a maximal feature list that's 60% broken.

### Non-Goals (explicitly out of scope, stated so nobody assumes otherwise)

- **No payment/fee system of any kind.** This directly contradicts your original written proposal (which listed "registration fee" and "payment QR codes" as a core feature). That decision was already made and locked in a prior session — flagging the conflict here for the record, since your proposal document promises it and your build does not deliver it. **You should proactively address this discrepancy in your presentation** ("we scoped payments out — all BIC events are free, so we prioritized [X] instead") rather than let a judge discover the gap.
- No multi-institution platform — BIC + the two named affiliated colleges only, not a general-purpose SaaS.
- No native mobile app.
- No offline mode.
- No multi-language support.
- No real Google OAuth by Aug 20 (see cuts below) — the button exists visually, not functionally.

---

## 4. User Stories

**Student**

- As a student, I want to sign up with my academic details auto-detected from my college, so that I don't have to manually pick my faculty/course every time.
- As a student, I want to browse events by category and search by keyword, so that I can find events relevant to me quickly.
- As a student, I want to register for an event in one flow, so that I don't need to fill out a separate Google Form.
- As a student, I want to see my registered events in one place, so that I know what I've signed up for.
- As a student, I want to give feedback after an event, so that organizers know what I thought.
- As a student, I want to see recommended events based on my past registrations, so that I discover things I'd actually like.

**Faculty**

- As faculty, I want my account reviewed before I can post events, so that only legitimate organizers can create content.
- As faculty, I want to create an event with all relevant details in one form, so that I don't need separate tools.
- As faculty, I want to build a custom feedback form per event, so that I can ask what's actually relevant to that specific event.
- As faculty, I want to see who registered for my event, so that I can plan capacity and follow up.

**Admin**

- As an admin, I want to approve or reject faculty signups, so that only real staff can organize events.
- As an admin, I want to see all events and users across the platform, so that I have full oversight.
- As an admin, I want to generate a report for an event, so that I have documentation after it's over.

---

## 5. Feature List — MVP / v2 / Later (revised for Aug 20 reality)

### MVP (must ship by Aug 20 — this is the demo)

| Feature                                                                                                                            | Status      |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Student Signup (BIC/Herald/Fishtail cascade + Guest branch)                                                                        | ✅ Done     |
| Login (email/password)                                                                                                             | ✅ Done     |
| Faculty Signup (Dept→Designation cascade, admin approval gate)                                                                     | Not started |
| Student Dashboard (stats, upcoming/past tabs, recommended, mini calendar)                                                          | Not started |
| Browse Events (search, category filter, sort)                                                                                      | Not started |
| Event Detail (Details/Gallery/Feedback tabs)                                                                                       | Not started |
| Registration (individual/team)                                                                                                     | Not started |
| My Registered Events                                                                                                               | Not started |
| Feedback — **full dynamic builder** (question types: short/long/rating/multiple-choice, Required toggle), per original locked spec | Not started |
| Faculty Dashboard + Create Event                                                                                                   | Not started |
| Admin Dashboard: pending faculty approvals + approve/reject                                                                        | Not started |
| Basic in-app notification bell (no email sending)                                                                                  | Not started |

**Decision confirmed (overrides the earlier recommendation in v1 of this doc):** the dynamic feedback builder stays in MVP scope as originally planned — not cut. This was flagged as the single biggest time risk against the Aug 20 date; the explicit decision is to keep full scope and accept that risk rather than cut features. Given that, **daily pace needs to be tight and nothing else in this MVP list should slip** — if the dynamic builder runs long, the first things to reconsider are the v2 items below, not silently dropping something else from MVP without a conversation.

### v2 (designed/discussed, cut for time — present as roadmap)

- Real Google OAuth (package installed, not wired)
- Email notifications via Nodemailer (confirmations, reminders)
- Calendar view (full month grid, not just Student Dashboard mini-calendar)
- Faculty "My Events" management view + Participants tab
- Admin Event Management (edit/delete/generate PDF report)
- Admin User Management (full user search/filter, not just pending approvals)
- Gallery pages (student + faculty)
- Profile pages (student + faculty)
- PDFKit-generated event reports
- Rate-limiting on auth endpoints (installed, disabled during dev)

### Later (genuine future roadmap, post-submission)

- Multi-college expansion beyond the 3 currently supported
- Real AI-based recommendations (current plan is simple tag-matching, which is honestly fine to call "basic AI" per your own proposal wording — don't oversell this to judges as ML)
- Waitlists for full events
- Calendar sync (Google Calendar / .ics export)
- Push notifications
- Analytics dashboard for admins (attendance trends, popular categories)

---

## 6. Detailed Functional Requirements (MVP only)

**Faculty Signup**

- Fields: Full Name, Email, Phone, Faculty ID (free text), Department (dropdown), Designation (cascades from Department; free text if "Business Academics"), Community (optional dropdown: Devsphere/AI Horizon/BIC Converge/Incognitus/N/A), Password, Confirm Password.
- No College Name field.
- On submit: creates user with `approval_status = 'pending'`. Cannot log in until admin approves.
- Amber banner: "Your account will be reviewed by an admin before you can create or manage events."

**Student Dashboard**

- Stats: Registered Events count, Upcoming This Week count, Events Attended count.
- Upcoming/Past tab toggle → same 2-column event card grid, filtered by date.
- Recommended For You: 2x2 grid, tag-matched against student's past registration categories.
- Mini calendar: current month, dots on days with events, today highlighted.

**Browse Events**

- Search bar (title match).
- Category pills: All + 7 categories.
- Sort by (newest/oldest), filter by date (upcoming/past), Community filter dropdown.
- 2-column card grid, paginated or infinite scroll (pick one — recommend simple pagination given time).

**Event Detail**

- Header: title, category pill, status pill, Register Now button (or Registered ✓ / Completed state).
- Info grid: Date, Time, Location, Organizer.
- Tabs: Event Details (description, rules, prizes), Gallery (event images), Feedback (rating summary + list).
- No Participants tab (faculty/admin only, cut to v2 alongside Faculty My Events).

**Registration**

- Dedicated page (not modal), reached via Register Now.
- BIC/Herald/Fishtail students: fields read-only, pulled from profile.
- Guest students: Name/Email/Phone/College read-only, Course/Major editable.
- Team Information (Optional): single comma-separated textarea, no complex add-member UI.
- Duplicate registration blocked server-side (unique constraint on event_id + user_id, already in schema).

**Feedback (simplified MVP version)**

- Star rating (1–5, required).
- One short-text question: "Any comments?" (optional).
- Shown once per event per student; blocked after first submission (unique constraint already in schema, though `feedback_forms`/`feedback_questions` tables are more than this simplified version needs — fine to leave unused, don't rip out the schema, just don't build the builder UI).

**Faculty Dashboard + Create Event**

- Dashboard: welcome header, stats (My Events, Upcoming), recent events list with Manage button (Manage can just link to Event Detail for MVP — full management view is v2).
- Create Event: Title, Description, Category, Location, Date/Time, Organizing Department, Organizing Community, Rules & Eligibility, Max Participants (optional), Image upload (max 10, 5MB each). No fee field.

**Admin Dashboard (MVP-minimum)**

- Pending Faculty Approvals list with Approve/Reject buttons.
- That's it for MVP — full stats/event management/reports are v2.

---

## 7. Data Model Sketch

Already implemented in `backend/src/database/schema.sql` — summarized here for PRD completeness:

- **users**: id, full_name, email, phone, password_hash, google_id, role (student/faculty/admin), avatar_url, is_bic_student, college_name, course_major, faculty_name, course_name, academic_level, academic_semester, academic_group, faculty_id_code, department, designation, community, approval_status
- **events**: id, title, description, category, location, event_date, event_time, organizing_department, organizing_community, rules_eligibility, prize_info, max_participants, status, created_by
- **event_images**: id, event_id, image_url
- **registrations**: id, event_id, user_id, team_members, registered_at, attended (unique on event_id+user_id)
- **feedback_forms / feedback_questions / feedback_responses**: exist in schema for the v2 dynamic builder; MVP feedback can either use a minimal subset of these tables (one hardcoded question) or you add two simple columns directly on a lighter table — **flagging this as a decision you need to make with whoever picks up the Feedback screen**, since building the full dynamic tables but only using them in a fixed way is a bit wasteful but not wrong.
- **notifications**: id, user_id, title, message, is_read, created_at

---

## 8. Edge Cases and Failure States

- **Duplicate email at signup** → 409, "An account with this email already exists" (already implemented).
- **Faculty logs in before approval** → 403, "Faculty account is pending" (already implemented).
- **Student registers for the same event twice** → blocked by DB unique constraint; needs a clean error message on the frontend (not yet built — flag for Registration screen work).
- **Event reaches max_participants** → Registration should disable/block once full. **Not yet specified how this is enforced** — flagging as open: does the Register button just disable, or does the backend reject with an error? Recommend backend rejection + frontend disabled state as the safe default.
- **Guest student from an unrecognized college** (typo, or a college not in the 3 supported) → currently falls back to Guest Participant, which is actually the correct/safe behavior, not a bug — worth stating explicitly so nobody "fixes" this later.
- **Image upload failure (size/count limit)** → Multer will reject server-side; frontend needs an error message, not yet built.
- **Feedback submitted twice** → blocked by DB unique constraint; needs frontend handling.

---

## 9. Success Metrics

Given this is judged/showcase-based, not live-usage-based, metrics should reflect **demo completeness and judge evaluation criteria**, not product analytics:

- All MVP features (Section 5) demonstrable live, end-to-end, without errors, in a single walkthrough.
- Signup → Login → Browse → Register → Feedback loop completable in front of judges in under 5 minutes.
- No visible console errors or broken states during the demo path.
- Presentation clearly and honestly distinguishes "built" vs "designed, planned for v2" — judges generally respond better to honest scoping than to a demo that breaks trying to show something half-built.
- (Soft metric, if judges ask) Ability to explain technical decisions clearly — feature-based architecture, dynamic vs fixed feedback tradeoff, why payments were cut, etc.

---

## 10. Open Questions

1. **Feedback: RESOLVED.** Decision confirmed — full dynamic builder stays in MVP, not simplified. This remains the single biggest schedule risk in this document; flagging again here so it's not forgotten if the Aug 20 date starts slipping.
2. **Max participants enforcement** — backend-reject vs frontend-disable-only (see Section 8). Needs a decision before Registration is built.
3. **CEO designation** — confirmed out of scope/unplaced per your answer. Just noting it stays absent from the Department→Designation table; not blocking anything.
4. **Pagination vs infinite scroll on Browse Events** — recommend simple pagination for time's sake; confirm you're fine with that over the fancier infinite scroll.
5. **Who actually builds what, given "we" but effectively solo** — this PRD assumes one person building sequentially. If any of your 6 teammates are genuinely available to pick up a screen in parallel, worth revisiting the daily task plan against this MVP list specifically, since the earlier 3-week plan is now obsolete against the Aug 20 date.
