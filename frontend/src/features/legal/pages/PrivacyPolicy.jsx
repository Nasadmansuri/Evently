import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarHeart, ArrowLeft, Shield, Lock, Eye, Database,
  FileCheck, UserCheck, HelpCircle, Mail, Landmark
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardPath } from '../../../shared/utils/navigation';

export default function PrivacyPolicy() {
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
              to="/terms"
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Terms & Conditions
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <Shield size={13} />
            Data Protection
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            How Evently collects, utilizes, and protects your personal, academic, and event attendance data.
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
              <h2 className="text-lg font-bold">Information We Collect</h2>
            </div>
            <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed pl-9">
              <p>
                <strong>Academic & Identity Details:</strong> Full name, institutional or personal email address, contact phone number, college affiliation, faculty name, course/degree, academic level, semester, and group assignment.
              </p>
              <p>
                <strong>Faculty Credentials:</strong> Faculty ID code, academic department, academic designation, and assigned community leadership.
              </p>
              <p>
                <strong>Event Data:</strong> Registered events, check-in timestamps, attendance verification records, and submitted feedback ratings.
              </p>
              <p>
                <strong>Authentication & Security:</strong> Securely salted password hashes (via bcrypt) or Google OAuth profile identifiers (ID, verified email, avatar).
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                2
              </div>
              <h2 className="text-lg font-bold">How Your Information Is Used</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed pl-9">
              <p>
                We use the collected information strictly for university operations, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Managing event capacities and attendee rosters.</li>
                <li>Verifying student eligibility for cohort-specific academic workshops and seminars.</li>
                <li>Issuing real-time in-app notifications regarding event updates, approvals, or cancellations.</li>
                <li>Providing department heads with aggregated, anonymized event engagement analytics.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                3
              </div>
              <h2 className="text-lg font-bold">Data Privacy & Third-Party Sharing</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              Your personal data is never sold, leased, or monetized for commercial marketing. Information is accessed solely by authorized campus administrators and faculty event organizers for educational and operational purposes.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                4
              </div>
              <h2 className="text-lg font-bold">Data Security & Storage</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              All network transmissions are encrypted with TLS/SSL protocols. Passwords and credentials are cryptographically protected, and role-based access controls strictly govern API interactions across students, faculty, and administrative tiers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-xs">
                5
              </div>
              <h2 className="text-lg font-bold">Your Rights & Contact</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-9">
              You have the right to review your registered profile details and request corrections through your campus profile settings or administration office. For data privacy inquiries, contact:
            </p>
            <div className="ml-9 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">Campus Data Protection & Evently Support</p>
              <p>Biratnagar International College · Evently Governance</p>
              <p>Email: <a href="mailto:evently.nexora@gmail.com" className="text-primary-700 underline font-semibold">evently.nexora@gmail.com</a></p>
            </div>
          </section>

        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
          <Link to="/terms" className="hover:text-primary-700 underline">
            Read Terms & Conditions &rarr;
          </Link>
          <Link to="/login" className="hover:text-primary-700 font-medium">
            Return to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
