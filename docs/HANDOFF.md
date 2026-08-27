# Evently — Comprehensive Project Handoff & Architecture Guide

**Evently** is a Production-Ready Smart Campus Event Management Web Platform built for **Biratnagar International College (BIC), Nepal**, affiliated with the **University of Wolverhampton (UK)** for the Summer Enrichment Program (SEP) Showcase.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 18 + Vite 8 + Tailwind CSS v3 (Pinned) + Axios + React Router v6 + Lucide React + Google Font (Manrope).
- **Backend**: Node.js + Express + MySQL (`mysql2/promise` connection pool) + Multer (image uploads) + PDFKit (branded PDF report generation) + JWT + bcryptjs + cors.
- **Database**: MySQL 8.0 (via XAMPP / phpMyAdmin), 9 interconnected tables with strict foreign key constraints and cascading deletes (`ON DELETE CASCADE`).
- **Repository Structure**: `d:\Evently`
  - `frontend/src/features/` — Feature modules: `auth`, `student`, `faculty`, `admin`, `events`, `feedback`, `profile`.
  - `frontend/src/shared/` — Reusable components, design system, API client, calendar integration, venue maps, utilities.
  - `backend/src/features/` — Controllers, models, and routes: `auth`, `users`, `events`, `registrations`, `feedback`, `notifications`.
  - `backend/src/shared/` — DB connection pool, auth middleware, role verification.

---

## 2. Design System & Visual Tokens

- **Brand Primary**: Deep Teal `#035352` (`primary-600` / `primary-700`) — single primary brand token used across navigation, CTA buttons, active state indicators, and focus rings.
- **Brand Accent**: Sidecar Yellow `#F3E8BC` (`amber-100` / `amber-500`) — used for scheduled release badges and subtle highlights.
- **Category Badge Tokens** (Strictly isolated from brand tokens):
  - **Technical**: Blue (`bg-blue-50 text-blue-700 border-blue-200`)
  - **Cultural**: Slate/Grey (`bg-slate-100 text-slate-700 border-slate-200`)
  - **Sports**: Pink (`bg-pink-50 text-pink-700 border-pink-200`)
  - **Workshop**: Orange (`bg-orange-50 text-orange-700 border-orange-200`)
  - **Competition**: Purple (`bg-purple-50 text-purple-700 border-purple-200`)
  - **Seminar**: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  - **Conference**: Slate (`bg-slate-100 text-slate-700 border-slate-200`)
- **Typography**: **Manrope** (Clean, modern geometric sans-serif loaded via Google Fonts).
- **Aesthetic Principles**: Clean SaaS UI, micro-animations, glassmorphism modals, structured cards with 24px/26px radius, no AI-slop or unstructured text overlaps.

---

## 3. Implemented Modules & Capabilities

### A. Authentication & Role-Based Access Control (RBAC)
1. **Student Registration**:
   - Dynamic academic cascading dropdowns for partner colleges:
     - **Biratnagar International College (BIC)** & **Herald College Kathmandu**: Full cascade (School of Architecture, Computing and Engineering OR School of Business and Law → Course → Level 4/5/6 → Semester 1–6 → Group G1–G10).
     - **Fishtail Mountain College**: Restricted to Computing school per real institutional structure.
     - **Guest Colleges**: Single Course/Major input with auto-detection.
   - 10-digit Nepali phone validation (`/^9\d{9}$/`).
2. **Faculty Registration**:
   - Institutional Faculty ID validation (`/^[A-Z]{2,5}-[A-Z]{2,5}-\d{3,5}$/i`, e.g. `BIC-FAC-0142`).
   - Department to Designation cascade (SSD, PAT, Registry & Examination, IT Academics, Business Academics).
   - DevCorps Community assignment (Devsphere, AI Horizon, BIC Converge, Incognitus).
   - **Admin Approval Gate**: Faculty accounts start in `pending` status until approved by an Admin.
3. **Session Management & Security**:
   - JWT authentication stored securely in localStorage.
   - Role-based route protectors (`requireAuth`, `requireRole('admin', 'faculty', 'student')`).
   - Session persistence on mount via `GET /api/users/me`.

### B. Event Management & Publishing
1. **Creation & Editing (`CreateEvent.jsx`)**:
   - Multi-image upload with banner selection (`/api/events/:id/images`).
   - Scheduled release engine (`Publish Immediately` vs. `Schedule for Later`).
   - Unlocked future release dates with `min={todayString}` and real-time 1-click **"Sync Event Date"** helper.
   - Individual vs Team event mode with max participant limits.
   - **Concluded Event Lock**: Accurately compares date AND time (`eventDateTime <= new Date()`). Concluded events have historical dates locked to prevent record tampering, while general details and gallery images remain editable.
2. **Admin Event Management & Cancellation (`ManageEvents.jsx`)**:
   - Clear distinction between **Organizer** (Academic Department / Community) and **Created By** (Faculty Account Name).
   - Administrative Event Cancellation workflow with recorded reason and notification dispatch.
   - Faculty Deletion Request review (Approve with reason or Reject).
   - **Permanent Cascading Deletion**: Hard delete with modal confirmation that cascades to registrations, images, feedback, and deletion requests.
3. **Event Discovery & Browse (`BrowseEvents.jsx`, `EventDetail.jsx`)**:
   - Search by title/description/organizer with instant live filtering.
   - Category filter pills + Status filters (All, Upcoming, Ongoing, Ended).
   - **Google Calendar & Apple/Outlook Sync**: Single unified `Add to Calendar ▾` dropdown on Event Details and Registration success screen.
   - **Campus Venue Location Modal**: Interactive venue map with room directories (Wulfruna, SR-Wolves, SR-Compton, Main Auditorium).

### C. Registration & Attendance System
1. **Student Registration (`Registration.jsx`, `MyRegistrations.jsx`)**:
   - One-click individual registration.
   - Dynamic team registration with member student IDs, full names, and college emails.
   - Capacity enforcement with real-time seat tracking.
   - "My Registrations" portal with Upcoming vs Past event tabs and feedback status badges.

### D. Dynamic Feedback Form Builder & Analytics
1. **Faculty Form Builder (`FeedbackFormBuilder.jsx`)**:
   - Dynamic form creator supporting multiple question types: 1–5 Star Rating, Short Answer, Multi-line Paragraph, and Single Choice / Radio.
   - Question reordering, Required toggle, and real-time preview.
2. **Student Feedback Submission (`StudentFeedback.jsx`)**:
   - Form unlocks automatically once event starts.
   - Star rating controls, character validation, and duplicate submission prevention.
3. **Faculty Analytics Dashboard (`FeedbackAnalytics.jsx`)**:
   - Aggregate average rating scores, satisfaction percentages, question breakdown, and student qualitative text responses.

### E. Admin Oversight & Branded Reporting
1. **Faculty Approvals (`FacultyApprovals.jsx`)**:
   - Real-time pending faculty approval queue with 1-click Approve / Reject.
2. **User Management (`UserManagement.jsx`)**:
   - Directory of all campus users with search, role filters, status toggles (Active / Suspended), and account deletion.
3. **Automated PDF Event Reports (`Reports.jsx`)**:
   - Generated on-the-fly using PDFKit.
   - Includes official BIC and Wolverhampton branding, full event metadata, attendance roster statistics, and feedback summary.

---

## 4. Key Database Tables & Relationships

```
+--------------------+       1:N       +----------------------+
|       users        | --------------> |        events        |
+--------------------+                 +----------------------+
          |                                       |
          | 1:N                                   | 1:N
          v                                       v
+--------------------+                 +----------------------+
|   registrations    | <-------------- |     event_images     |
+--------------------+                 +----------------------+
          |                                       |
          |                                       v
          |                            +----------------------+
          |                            | event_deletion_reqs  |
          |                            +----------------------+
          |                                       |
          v                                       v
+--------------------+       1:N       +----------------------+
| feedback_responses | <-------------- |    feedback_forms    |
+--------------------+                 +----------------------+
                                                  | 1:N
                                                  v
                                       +----------------------+
                                       |  feedback_questions  |
                                       +----------------------+
```
*All foreign keys are configured with `ON DELETE CASCADE` to ensure clean permanent deletions without orphaned rows.*

---

## 5. Quick Start & Local Development

### Start Backend:
```bash
cd d:\Evently\backend
npm run dev
# Server running on http://localhost:5000
```

### Start Frontend:
```bash
cd d:\Evently\frontend
npm run dev
# Vite dev server running on http://localhost:5173
```

### Build Verification:
```bash
cd d:\Evently\frontend
npm run build
# Production build passes with 0 lint or build errors
```

---

## 6. Seed Credentials

- **Admin Account**: `admin@bic.edu.np` / `Admin@123`
- **Faculty Account**: `faculty@bic.edu.np` / `Faculty@123`
- **Student Account**: `student@bic.edu.np` / `Student@123`
