# Evently — Project Handoff (paste this as your first message in the new chat)

I'm building "Evently," a Smart Campus Event Management web platform for Biratnagar
International College (BIC), Nepal, for a Summer Enrichment Program (SEP) Web category
showcase, affiliated with University of Wolverhampton. Team name NEXORA Group on paper,
building with team. **DEADLINE: Aug 20, 2026** — hard, compressed deadline.

I have two reference documents I'll attach: **Evently_PRD.md** and **Evently_Design_Brief.md**.
Read both fully before responding to anything else.

## Tech Stack

- Frontend: React 18 + Vite + Tailwind CSS v3 (pinned, NOT v4) + Axios + React Router +
  lucide-react (icons) + Manrope font (Google Fonts, loaded via index.html link tag,
  set as Tailwind's fontFamily.sans default)
- Backend: Node.js + Express + MySQL (mysql2/promise) + Multer + Nodemailer + PDFKit +
  JWT + bcryptjs + google-auth-library + cors
- Database: MySQL via XAMPP (phpMyAdmin), 8 tables already created and confirmed working
- Root folder: D:\Evently, subfolders named `frontend`/`backend` (NOT client/server)
- Feature-based folder structure on both sides:
  frontend/src/features/{auth,student,faculty,admin,events,feedback,notifications}/
  frontend/src/shared/{layout,components,context,services,utils}/
  backend/src/features/{auth,users,events,registrations,feedback,notifications}/
  backend/src/shared/{config,middleware,utils}/
- GitHub: https://github.com/Nasadmansuri/Evently.git, main branch

## Locked Color Theme (finalized — do not suggest alternatives)

- Primary: **Teal #035352** (`primary-600` in Tailwind config) — the ONLY brand color,
  used for every button/link/active-state/focus-ring/logo
- Accent: **Sidecar Yellow #F3E8BC** — sparing use only, highlight badges, never a
  second primary
- Category tags (must never collide with primary/accent): Technical=#2563EB blue,
  Cultural=#6B7280 grey, Workshop=#F97316 orange, Competition=#9333EA purple,
  Seminar=#B45309 amber/brown, Sports=#EC4899 pink (exclusive to Sports), Conference=#475569 slate
- Font: **Manrope**, deliberately chosen over Inter/Poppins (those read as generic
  "AI-app default" now)
- Full tailwind.config.js already updated with these tokens — see Design Brief Section 3
  for the complete rationale

## Design Principles (apply to every new screen, no exceptions)

1. **Compact over spacious** — mobile-first, small padding/type by default
   (`py-2`, `text-sm`/`text-xs`, `p-5 sm:p-7` card padding), scale up with `sm:`/`md:`,
   never desktop-first. This was a hard lesson from an early pass — don't repeat it.
2. **Function before flourish** — no gradients, no illustrated mascots, no
   glassmorphism, no emoji as functional icons (lucide-react for everything).
3. **One accent color used sparingly** — Teal means "primary," nothing competes with it
   except the constrained category tag colors.

## Established Code Patterns (match these exactly on new screens)

Every form screen built so far shares these constants — reuse this exact pattern:

```js
const inputClass =
  "w-full border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white";
const selectClass =
  "w-full appearance-none border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed";
const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";
const chevronClass =
  "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none";
const labelClass = "block text-xs font-medium text-gray-700 mb-1";
```

Buttons: `bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50`
Error banners: `flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2` with an `AlertCircle` icon.
Password toggles need `aria-label={showX ? 'Hide password' : 'Show password'}`.
Phone number fields: digit-only filtering + 10-digit Nepali validation:

```js
onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
// validation: /^9\d{9}$/.test(phone)
```

Text fields prone to browser autofill weirdness need `autoComplete="off"` + a unique `name` attribute; password fields need `autoComplete="new-password"`.

## What's Fully Built and Tested (end-to-end, working)

**Backend** (`backend/src/features/auth/`):

- `auth.model.js`: `findByEmail`, `findById`, `createStudent`, `createFaculty` — all working
- `auth.controller.js`: `login`, `signupStudent`, `signupFaculty` — all working
- `auth.routes.js`: `POST /login`, `POST /signup/student`, `POST /signup/faculty` — all wired
- `backend/src/features/users/`: `GET /api/users/me` (JWT-protected) for session persistence
- `backend/src/shared/config/db.js`: MySQL pool connection, confirmed working
- CORS enabled, `.env` configured (DB creds, JWT_SECRET, PORT=5000)
- All 8 tables exist in the `evently` database via phpMyAdmin (users, events, event_images,
  registrations, feedback_forms, feedback_questions, feedback_responses, notifications)
- **Known gap:** no `schema.sql` was saved to the repo when tables were created directly in
  phpMyAdmin — should be exported (phpMyAdmin → Export → Quick → SQL) and committed to
  `backend/src/database/schema.sql` if not already done.

**Frontend — Auth pages, all three fully working:**

- `Login.jsx` — email/password, validation, password show/hide, session persistence via
  AuthContext calling `/api/users/me` on mount, Teal-themed, Manrope font
- `StudentSignup.jsx` — Full Name/Email/Phone/College Name, LIVE branching based on
  college name match: BIC/Herald/Fishtail → full academic cascade (School→Course→
  Level→Semester→Group cascading dropdowns), anything else → Guest Participant
  (single Course/Major field). Phone validated. Tested working for both branches
  against the real database.
- `FacultySignup.jsx` — Full Name/Email/Phone/Faculty ID/Department→Designation
  cascade (Business Academics = free-text designation, not dropdown)/optional
  Community dropdown/amber pending-approval banner. Faculty ID format validated
  via regex (`/^[A-Z]{2,5}-[A-Z]{2,5}-\d{3,5}$/i`, e.g. "BIC-FAC-0142" shaped).
  Tested working end-to-end — confirmed a real pending faculty row in the database.

**Shared data files:**

- `frontend/src/shared/utils/academicCascade.js` — exports `ACADEMIC_STRUCTURE`
  (using OFFICIAL Wolverhampton school names: "School of Architecture, Computing and
  Engineering" and "School of Business and Law" — NOT "Faculty of..."), `GROUPS`
  (G1–G10), `matchAffiliatedCollege()` (matches bic/herald/fishtail aliases,
  case-insensitive), `getFacultiesForCollege()` (Fishtail restricted to Computing
  school only — confirmed real via their actual site, not a simplification),
  `getSemestersForLevel()`.
- `frontend/src/shared/utils/facultyStructure.js` — exports `DEPARTMENT_DESIGNATIONS`
  (SSD/PAT/Registry-Timetable-Examination/IT Academics/Business Academics — last one
  maps to `null` meaning free-text), `COMMUNITIES` (Devsphere/AI Horizon/BIC
  Converge/Incognitus/N/A — confirmed final at 4, no 5th).
- `frontend/tailwind.config.js` — updated with full Teal/Sidecar Yellow/category
  token system (see Design Brief Section 3 for the source of truth).
- `frontend/index.html` — Manrope font links added.

## Confirmed Scope Decisions (do not revisit without being asked)

- **NO payment/fee system anywhere.** Contradicts the original written SEP proposal
  (which mentioned fees/QR codes) — deliberately cut, PRD documents this discrepancy
  to be addressed honestly in the presentation.
- **Dynamic feedback form builder STAYS IN MVP scope**, not simplified — this was
  flagged as the single biggest schedule risk against Aug 20 and the explicit decision
  was to keep full scope anyway. Not started yet.
- CEO faculty designation: intentionally left unplaced in the Department table.
- DevCorps community list: confirmed final at 4, no 5th.
- Academic structure shared identically across BIC/Herald/Fishtail (timeline
  simplification), EXCEPT Fishtail's real Business-school restriction.
- Full MVP/v2/later feature split is in PRD Section 5 — the v2/later items are
  explicitly OUT of Aug 20 scope (Gallery, Profile pages, real Google OAuth, email
  sending, PDF reports, full Admin Event/User Management beyond approvals,
  rate-limiting re-enable).

## What's Next (in order)

1. **Admin Dashboard (MVP-minimum: pending faculty approvals view only)** — needed
   next specifically to close the loop on the faculty account currently sitting as
   `pending` in the database. Needs: `GET /api/users/pending-faculty` (or similar),
   `PATCH /api/users/:id/approval` backend endpoints (may partially exist from an
   earlier scaffold pass — check before rebuilding), plus a simple frontend list
   view with Approve/Reject buttons per row.
2. Student Dashboard (stats, upcoming/past tabs, recommended section, mini calendar)
3. Browse Events, Event Detail, Registration, My Registered Events
4. Feedback (dynamic builder — both the faculty-side builder UI and student-side
   dynamic renderer)
5. Faculty Dashboard + Create Event
6. Full detailed functional requirements per screen are in PRD Section 6 — reference
   that instead of re-deriving requirements from scratch.

## Style of Working Together

- Give complete, ready-to-paste code blocks, not step-by-step typing instructions.
- Always specify EXACTLY which existing line/block to find and replace — never
  "add this somewhere."
- Build frontend AND backend together per feature, not sequentially (Student Signup's
  backend lagging the frontend caused wasted round-trips early on — don't repeat that).
- After giving code, state exactly what to test to confirm it worked.
- If pasted code breaks (e.g. a function accidentally nested inside another, a
  missing export), ask to see the full current file content rather than guessing at
  a patch — this already happened twice with `auth.model.js`/`auth.controller.js`
  and asking for the full file was what actually found the real issue fast.
- Given the compressed deadline, be decisive — don't offer multiple options where the
  PRD/Design Brief already made the decision; just build to spec.
- I'm testing everything hands-on myself (typing code, running npm/git commands) —
  don't offer to do it for me, walk me through exact code + exact commands.

Please confirm you've read the attached PRD and Design Brief, then help me build the
Admin Dashboard (pending faculty approvals) next.
