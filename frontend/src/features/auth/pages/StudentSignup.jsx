import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Landmark, GraduationCap, Lock, ShieldCheck,
  UserPlus, Layers, BarChart3, CalendarDays, Users, CheckCircle2, UserCircle, AlertCircle,
  Loader2, Eye, EyeOff, CalendarHeart, ChevronDown, KeyRound, X, ArrowRight, RefreshCw,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { ACADEMIC_STRUCTURE, GROUPS, matchAffiliatedCollege, getFacultiesForCollege, getSemestersForLevel } from '../../../shared/utils/academicCascade';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';

export default function StudentSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoleSwitch = Boolean(location.state?.fromRoleSwitch);
  const { user, login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [courseMajor, setCourseMajor] = useState('');

  const [facultyName, setFacultyName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [academicSemester, setAcademicSemester] = useState('');
  const [academicGroup, setAcademicGroup] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const matchedCollegeName = matchAffiliatedCollege(collegeName);
  const isBic = !!matchedCollegeName;
  const facultyOptions = matchedCollegeName ? getFacultiesForCollege(matchedCollegeName) : [];

  const courseOptions = useMemo(
    () => (facultyName ? Object.keys(ACADEMIC_STRUCTURE[facultyName]) : []),
    [facultyName]
  );
  const levelOptions = useMemo(
    () => (facultyName && courseName ? ACADEMIC_STRUCTURE[facultyName][courseName].levels : []),
    [facultyName, courseName]
  );
  const semesterOptions = useMemo(
    () => (academicLevel ? getSemestersForLevel(facultyName, courseName, academicLevel) : []),
    [facultyName, courseName, academicLevel]
  );

  function handleFacultyChange(value) {
    setFacultyName(value);
    setCourseName('');
    setAcademicLevel('');
    setAcademicSemester('');
    setAcademicGroup('');
  }

  function handleCourseChange(value) {
    setCourseName(value);
    setAcademicLevel('');
    setAcademicSemester('');
    setAcademicGroup('');
  }

  function handleLevelChange(value) {
    setAcademicLevel(value);
    setAcademicSemester('');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleInitiateSignup(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (!collegeName.trim()) return setError('Please enter your college name');
    if (!/^9\d{9}$/.test(phone)) {
      return setError('Please enter a valid 10-digit phone number (starting with 9)');
    }

    if (isBic) {
      if (!facultyName || !courseName || !academicLevel || !academicSemester || !academicGroup) {
        return setError('Please complete all academic details');
      }
    } else {
      if (!courseMajor.trim()) return setError('Please enter your course/major');
    }

    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      // Step 1: Request Email Verification OTP
      await api.post('/auth/signup/send-otp', { email: email.trim().toLowerCase() });
      setShowOtpModal(true);
      showToast.success(`Verification code sent to ${email}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code';
      const reason = err.response?.data?.reason ? ` Reason: ${err.response.data.reason}` : '';
      setError(`${msg}${reason}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    setOtpError('');
    try {
      await api.post('/auth/signup/send-otp', { email: email.trim().toLowerCase() });
      showToast.success('New verification code sent to your email');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyAndCompleteSignup(e) {
    e.preventDefault();
    setOtpError('');

    if (!otp || otp.trim().length !== 6) {
      return setOtpError('Please enter the 6-digit verification code');
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/signup/student', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        collegeName: collegeName.trim(),
        courseMajor: isBic ? undefined : courseMajor.trim(),
        facultyName: isBic ? facultyName : undefined,
        courseName: isBic ? courseName : undefined,
        academicLevel: isBic ? academicLevel : undefined,
        academicSemester: isBic ? academicSemester : undefined,
        academicGroup: isBic ? academicGroup : undefined,
        password,
        otp: otp.trim(),
      });

      if (res.data.token) {
        login(res.data.user, res.data.token);
      }
      showToast.success('Email verified & account created! Welcome to Evently.');
      setShowOtpModal(false);
      navigate('/student/dashboard');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  }

  const inputClass =
    'skeuo-input w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400';
  const selectClass =
    'skeuo-input w-full appearance-none rounded-xl px-3.5 pr-9 py-2.5 text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#edf0f5] p-2.5 sm:p-3 md:p-4 selection:bg-primary-600 selection:text-white flex items-center justify-center overflow-y-auto lg:overflow-hidden">
      {/* Master Dual-Column Container */}
      <div className="w-full max-w-[1340px] h-auto lg:h-[calc(100vh-2.5rem)] max-h-[840px] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: SheKunj Floating Inset Card */}
        <div className="lg:col-span-6 m-2.5 sm:m-3 lg:m-3.5 rounded-[22px] sm:rounded-[28px] bg-gradient-to-br from-[#023433] via-[#012626] to-[#011415] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden shadow-lg border border-emerald-900/40">
          {/* Flashlight Beam Sweep Effect - Only on Sign In / Join Us navigation */}
          {!isRoleSwitch && <div className="animate-flashlight" />}

          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

          {/* 1. Top Header: Logo + Navigation Pills (Stays solid & constant) */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarHeart size={18} className="text-emerald-300" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                Evently
              </span>
            </Link>

            <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5 border border-white/15 backdrop-blur-md">
              <Link
                to="/login"
                className="rounded-full px-3 py-1 text-xs font-medium text-slate-200 hover:text-white transition"
              >
                Sign In
              </Link>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-xs">
                Join Us
              </span>
            </div>
          </div>

          {/* 2. Middle Content: Student Value Propositions (Slides up from bottom) */}
          <div className="relative z-10 my-auto py-4 sm:py-6 space-y-4">
            <div className="space-y-1.5 animate-slide-up">
              <span className="inline-block text-[10px] font-extrabold tracking-widest uppercase text-emerald-300/90 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-2">
                Student Onboarding Portal
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
                Join Evently.<br />Never miss an event.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md mt-1">
                Register with your student details or college email to discover hackathons, technical workshops, and campus communities.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-1 animate-slide-up-delay-1">
              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-200 font-medium">
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                </div>
                <span>Access college hackathons, workshops & tech summits</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-200 font-medium">
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                </div>
                <span>Instant 1-tap registration & digital QR attendance passes</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-slate-200 font-medium">
                <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                </div>
                <span>Connect with BIC DevCorps student communities</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Metric Stats Bar */}
          <div className="relative z-10 pt-4 border-t border-white/15 grid grid-cols-3 gap-3 animate-slide-up-delay-2">
            <div>
              <p className="text-lg sm:text-xl font-black text-white">100%</p>
              <p className="text-[10.5px] text-slate-300 font-medium">Free Access</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-white">1-Tap</p>
              <p className="text-[10.5px] text-slate-300 font-medium">Registration</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-white">Official</p>
              <p className="text-[10.5px] text-slate-300 font-medium">BIC Platform</p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Form Container with Smooth Slide-Up Entrance */}
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-4 sm:py-6 h-full max-w-lg mx-auto w-full overflow-y-auto no-scrollbar">
          <div className="w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="mb-4 animate-slide-up">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Create your student account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Join Evently and discover upcoming campus opportunities.
              </p>
            </div>

            {/* Student / Faculty toggle in Skeuomorphic Tray */}
            <div className="skeuo-tray flex rounded-full p-1 mb-4 animate-slide-up">
              <button
                type="button"
                className="skeuo-pill-active flex-1 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-default"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup/faculty', { state: { fromRoleSwitch: true } })}
                className="flex-1 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                Faculty
              </button>
            </div>

            {error && (
              <div className="mb-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2 animate-slide-up">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiateSignup} className="space-y-3 animate-slide-up-delay-1">
              {/* Row: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nasad Mansuri"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bicnepal.edu.np"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row: Phone & College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98XXXXXXXX"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Name</label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Biratnagar International College"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Affiliation Indicator */}
              {collegeName.trim() && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border ${
                    isBic
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {isBic ? (
                    <>
                      <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
                      <span className="font-semibold text-xs">Wolverhampton-affiliated student ({matchedCollegeName})</span>
                    </>
                  ) : (
                    <>
                      <UserCircle size={14} className="text-slate-500 shrink-0" />
                      <span className="text-xs font-semibold">Guest Participant</span>
                    </>
                  )}
                </div>
              )}

              {/* Affiliated Cascade vs Guest Major */}
              {isBic ? (
                <div className="space-y-2.5 rounded-2xl bg-slate-50/80 p-3 border border-slate-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / School</label>
                      <div className="relative">
                        <select
                          required
                          value={facultyName}
                          onChange={(e) => handleFacultyChange(e.target.value)}
                          className="skeuo-input w-full appearance-none rounded-xl px-3.5 pr-8 py-2 text-sm text-slate-900 disabled:opacity-50"
                        >
                          <option value="">Select Faculty</option>
                          {facultyOptions.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <ChevronDown className={chevronClass} size={14} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                      <div className="relative">
                        <select
                          required
                          value={courseName}
                          onChange={(e) => handleCourseChange(e.target.value)}
                          disabled={!facultyName}
                          className="skeuo-input w-full appearance-none rounded-xl px-3.5 pr-8 py-2 text-sm text-slate-900 disabled:opacity-50"
                        >
                          <option value="">{facultyName ? 'Select Course' : 'Select Faculty First'}</option>
                          {courseOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className={chevronClass} size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Level</label>
                      <div className="relative">
                        <select
                          required
                          value={academicLevel}
                          onChange={(e) => handleLevelChange(e.target.value)}
                          disabled={!courseName}
                          className="skeuo-input w-full appearance-none rounded-xl px-2.5 pr-7 py-2 text-sm text-slate-900 disabled:opacity-50"
                        >
                          <option value="">Level</option>
                          {levelOptions.map((l) => (
                            <option key={l} value={l}>Level {l}</option>
                          ))}
                        </select>
                        <ChevronDown className={chevronClass} size={12} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                      <div className="relative">
                        <select
                          required
                          value={academicSemester}
                          onChange={(e) => setAcademicSemester(e.target.value)}
                          disabled={!academicLevel}
                          className="skeuo-input w-full appearance-none rounded-xl px-2.5 pr-7 py-2 text-sm text-slate-900 disabled:opacity-50"
                        >
                          <option value="">Sem</option>
                          {semesterOptions.map((s) => (
                            <option key={s} value={s}>Sem {s}</option>
                          ))}
                        </select>
                        <ChevronDown className={chevronClass} size={12} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Group</label>
                      <div className="relative">
                        <select
                          required
                          value={academicGroup}
                          onChange={(e) => setAcademicGroup(e.target.value)}
                          disabled={!academicSemester}
                          className="skeuo-input w-full appearance-none rounded-xl px-2.5 pr-7 py-2 text-sm text-slate-900 disabled:opacity-50"
                        >
                          <option value="">Group</option>
                          {GROUPS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        <ChevronDown className={chevronClass} size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Major</label>
                  <input
                    type="text"
                    required
                    value={courseMajor}
                    onChange={(e) => setCourseMajor(e.target.value)}
                    placeholder="e.g. BSc Computer Science, MBA, BBA"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* Row: Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="skeuo-input w-full rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="skeuo-input w-full rounded-xl px-3.5 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Validation Hints */}
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className={password.length >= 8 ? 'text-emerald-700 font-semibold' : ''}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </span>
                <span
                  className={
                    confirmPassword && password === confirmPassword
                      ? 'text-emerald-700 font-semibold'
                      : ''
                  }
                >
                  {confirmPassword && password === confirmPassword ? '✓' : '○'} Passwords match
                </span>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-0.5">
                By creating an account you agree to our{' '}
                <Link to="/terms" target="_blank" className="text-primary-700 font-semibold underline hover:text-primary-800">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-primary-700 font-semibold underline hover:text-primary-800">
                  Privacy Policy
                </Link>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="skeuo-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {loading ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />}
                {loading ? 'Validating Email...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-4 animate-slide-up-delay-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-700 font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 6-Digit Email Verification OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Verify Your Email Address</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code sent to <span className="font-semibold text-slate-800">{email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
              <p className="text-[11px] text-emerald-800">
                Please check your inbox and enter the 6-digit verification code below to activate your account.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyAndCompleteSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="skeuo-input w-full rounded-xl px-3.5 py-2.5 text-base tracking-widest font-mono text-center"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-primary-700 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="skeuo-btn-secondary flex-1 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="skeuo-btn-primary flex-1 py-2.5 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {otpLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  {otpLoading ? 'Verifying...' : 'Verify & Enter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}