import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarHeart, ArrowLeft, Shield, FileText, CheckCircle2, Lock,
  Users, Award, AlertTriangle, HelpCircle, Mail, Landmark
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardPath } from '../../../shared/utils/navigation';

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <Link
              to={getDashboardPath(user)}
              className="flex items-center gap-2 hover:opacity-90 transition group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <CalendarHeart size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-primary-700 transition-colors">
                Evently
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              to="/privacy"
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Privacy Policy
            </Link>
            <Link
              to={user ? getDashboardPath(user) : '/login'}
              className="rounded-lg bg-primary-600 px-3.5 py-1.5 text-white transition hover:bg-primary-700 shadow-xs"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">
            <FileText size={13} />
            Campus Agreement
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Guidelines and policies governing student, faculty, and guest engagement on the Evently Campus Event Management Platform.
          </p>
          <p className="text-xs text-slate-400">
            Last Updated: August 2026 · Biratnagar International College & Partner Institutions
          </p>
        </div>
      </section>

      {/* Document Body */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs space-y-10">

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                1
              </div>
              <h2 className="text-lg font-bold">Acceptance of Terms</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              By accessing, registering with, or utilizing the Evently platform, you agree to comply with and be bound by these Terms & Conditions. These policies apply to all registered students, faculty members, guests, and administrative staff associated with Biratnagar International College (BIC), partner universities, and affiliated organizations.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                2
              </div>
              <h2 className="text-lg font-bold">User Eligibility & Account Registration</h2>
            </div>
            <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed pl-9">
              <p>
                <strong>Affiliated Students:</strong> Must register using their verified institution email address (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-xs">@bicnepal.edu.np</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-xs">@heraldcollege.edu.np</code>, etc.) and accurately maintain their academic level, semester, and group.
              </p>
              <p>
                <strong>Faculty Members:</strong> Registration requires validation with an official Faculty ID Code, designated academic department, and formal approval by campus administration before hosting events.
              </p>
              <p>
                <strong>Guest Participants:</strong> External participants from non-affiliated colleges may register for public events by providing valid identity details and institution information.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                3
              </div>
              <h2 className="text-lg font-bold">Event Creation & Management</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed pl-9">
              <p>
                Faculty members and authorized organizers are responsible for the accuracy of all event details, schedules, venue allocations, and capacity limits.
              </p>
              <p>
                Event deletion requests must follow formal campus governance protocols, requiring a submitted problem statement for administrative review before an event with active registrations can be removed.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                4
              </div>
              <h2 className="text-lg font-bold">Event Registrations & Attendance</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed pl-9">
              <p>
                Students may only register for events where they meet the specified academic and capacity criteria. Submitting duplicate or fraudulent attendance check-ins is strictly prohibited and subject to disciplinary review.
              </p>
              <p>
                Post-event feedback must remain constructive and respectful, adhering to institutional codes of conduct.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                5
              </div>
              <h2 className="text-lg font-bold">Account Suspension & Deactivation</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              Campus administration reserves the right to suspend or deactivate any account that violates institutional policies, misrepresents credentials, or engages in disruptive behavior. When an account is deactivated, access is revoked, and the documented administrative reason is communicated upon login.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                6
              </div>
              <h2 className="text-lg font-bold">Contact & Institutional Inquiries</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              If you have any questions regarding these terms or campus event policies, please contact the campus administration office:
            </p>
            <div className="ml-9 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">Campus Administration & Evently Team</p>
              <p>Biratnagar International College · Evently Campus Portal Governance</p>
              <p>Email: <a href="mailto:evently.nexora@gmail.com" className="text-primary-700 underline font-semibold">evently.nexora@gmail.com</a></p>
            </div>
          </section>

        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
          <Link to="/privacy" className="hover:text-primary-700 underline">
            Read Privacy Policy &rarr;
          </Link>
          <Link to="/login" className="hover:text-primary-700 font-medium">
            Return to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
