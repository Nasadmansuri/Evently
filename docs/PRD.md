# Evently — Product Requirements Document (PRD)

**Smart Campus Event Management Platform** · NEXORA Group · SEP Web Category · Biratnagar International College (affiliated with University of Wolverhampton, UK)

_Version 2.0 (Final Delivered Build) — August 2026_

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
At Biratnagar International College (BIC), campus event coordination was historically hindered by three critical friction points:
1. **Discovery Failure**: Event announcements were buried in general academic email threads and scattered WhatsApp groups.
2. **Coordination Failure**: Faculty organizers relied on one-off Google Forms and disconnected spreadsheets, leading to duplicate entries, lack of capacity controls, and manual attendance reconciliation.
3. **Feedback Failure**: No centralized, structured post-event evaluation pipeline existed to capture student feedback and evaluate event success.

### 1.2 The Solution: Evently
**Evently** is an end-to-end event discovery, registration, scheduling, and feedback platform tailored to the academic and operational structure of BIC and its partner colleges (Herald College Kathmandu and Fishtail Mountain College).

---

## 2. Target Personas & Roles

| Role | Responsibilities & Capabilities |
| :--- | :--- |
| **Student** | Discover campus events, filter by category/status, register (individually or as a team), sync dates to Google Calendar / Apple Calendar, attend events, submit feedback, and view post-event photo galleries. |
| **Faculty Organizer** | Request faculty account verification, create/schedule rich campus events, attach venue locations, define registration caps, build custom feedback forms, track live attendee rosters, export attendee CSVs, and analyze feedback analytics. |
| **Administrator** | Supervise all platform activity, approve/reject faculty accounts, manage all events, handle cancellation & deletion requests, generate official branded PDF event reports, and oversee student/faculty user accounts. |

---

## 3. Scope & Feature Matrix

| Feature Module | Requirement & Implementation | Status |
| :--- | :--- | :--- |
| **Authentication & RBAC** | JWT-based auth with secure password hashing (`bcryptjs`), role gates (`admin`, `faculty`, `student`), session persistence (`/api/users/me`). | ✅ Delivered |
| **Academic Cascade Signup** | Dynamic Wolverhampton cascading dropdowns (School → Course → Level → Semester → Group) for BIC, Herald, and Fishtail; guest student fallback. | ✅ Delivered |
| **Faculty ID & Approval Gate** | Regex validation for institutional ID format (`BIC-FAC-XXXX`), department/community cascades, and admin approval queue. | ✅ Delivered |
| **Browse & Search** | Real-time text search across titles, descriptions, and organizers; category filtering (Technical, Cultural, Sports, Workshop, Competition, Seminar, Conference); event status tabs. | ✅ Delivered |
| **Event Detail Hub** | Hero banner, rich metadata, interactive tab layout (Details, Gallery, Feedback), campus venue direction modal, and single unified `Add to Calendar ▾` dropdown. | ✅ Delivered |
| **Calendar Integration** | Direct Google Calendar URL template generation + RFC 5545 `.ics` file download for Apple Calendar, Outlook, and mobile devices. | ✅ Delivered |
| **Registration Engine** | Individual and team registrations with dynamic teammate input (Student ID, Name, Email), capacity enforcement, and duplicate prevention. | ✅ Delivered |
| **My Registrations** | Dedicated student portal for upcoming vs. past registrations, registration status tracking, and dynamic feedback unlock triggers. | ✅ Delivered |
| **Dynamic Form Builder** | Drag/reorder custom question builder supporting 1–5 Star Ratings, Short Answers, Paragraphs, and Multiple Choice with Required flags. | ✅ Delivered |
| **Feedback Submission** | Real-time response validation, star ratings, single-submission lock, and automatic unlocking upon event commencement. | ✅ Delivered |
| **Feedback Analytics** | Interactive satisfaction metrics, question-by-question scoring distribution, and qualitative student feedback cards. | ✅ Delivered |
| **Concluded Event Lock** | Precise timestamp checking (`eventDateTime <= new Date()`) that locks historical event dates/times while allowing detail & photo editing. | ✅ Delivered |
| **Admin Oversight & PDF** | Full user management, faculty approvals, deletion request review, and automated branded PDF report generation via PDFKit. | ✅ Delivered |
| **Campus Venue Maps** | Interactive campus room guide (Wulfruna, SR-Wolves, SR-Compton, Main Auditorium) with directions and capacity info. | ✅ Delivered |

---

## 4. UI/UX & Design System Guidelines

1. **Color Palette**:
   - **Primary Teal**: `#035352` (`primary-600` / `primary-700`) — The sole brand primary for all interactive buttons, links, active tabs, and focus rings.
   - **Accent Yellow**: `#F3E8BC` (`amber-100` / `amber-500`) — Reserved for scheduled release badges and highlights.
   - **Category Tokens**: Technical (Blue), Cultural (Slate), Sports (Pink), Workshop (Orange), Competition (Purple), Seminar (Amber), Conference (Slate).
2. **Typography**: **Manrope** (Google Fonts) geometric sans-serif for clean readability and modern SaaS aesthetics.
3. **Component Design**:
   - High-contrast text with accessible slate/neutral tones.
   - 24px/26px rounded card structures with subtle border tokens (`border-slate-200`).
   - Smooth micro-animations and dialog transitions without cluttered overlays.

---

## 5. Security & Data Integrity

1. **Database Cascading**: All foreign keys utilize `ON DELETE CASCADE` so deleting an event cleanly purges related images, registrations, deletion requests, feedback forms, and responses.
2. **Role & Ownership Guards**: All mutating endpoints (`PATCH`, `DELETE`) verify user ownership (`created_by === req.user.id`) or administrator privileges (`role === 'admin'`).
3. **Historical Timestamp Protection**: Concluded events cannot have their historical `event_date` or `event_time` altered via UI or API.
4. **Input Sanitization**: Digit-only phone filtering, strict ID format checks, and SQL injection prevention via parameterized queries.

---

## 6. Verification & Quality Assurance

- **Build Pipeline**: Tested with Vite 8 client bundle (`npm run build`) passing with 0 errors.
- **Backend API**: Tested against Node.js Express server with MySQL 8 pool connection.
- **Cross-Browser Verification**: Responsive across mobile, tablet, and desktop viewports.
