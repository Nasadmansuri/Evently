import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, IdCard, Landmark, Briefcase, Users, Lock, ShieldCheck,
  UserPlus, Info, AlertCircle, Loader2, Eye, EyeOff, CalendarHeart, ChevronDown, CheckCircle2,
  KeyRound, X, RefreshCw, ArrowRight,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardPath } from '../../../shared/utils/navigation';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';

export default function FacultySignup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [facultyIdCode, setFacultyIdCode] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [community, setCommunity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  const designationOptions = useMemo(
    () => (department ? DEPARTMENT_DESIGNATIONS[department] : null),
    [department]
  );
  const isFreeTextDesignation = Boolean(department && designationOptions === null);

  function handleDepartmentChange(dep) {
    setDepartment(dep);
    setDesignation('');
    if (dep !== 'DevCorps') {
      setCommunity('');
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleInitiateSignup(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (!/^9\d{9}$/.test(phone)) {
      return setError('Please enter a valid 10-digit phone number (starting with 9)');
    }
    if (!facultyIdCode.trim() || facultyIdCode.trim().length < 3) {
      return setError('Faculty ID should look like BIC-FAC-0142 or HERALD-FAC-001');
    }
    if (!department) return setError('Please select your department');
    if (!designation.trim()) return setError('Please select or enter your designation');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/signup/send-otp', { email: email.trim().toLowerCase() });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
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
      const res = await api.post('/auth/signup/send-otp', { email: email.trim().toLowerCase() });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
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
      await api.post('/auth/signup/faculty', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        facultyIdCode: facultyIdCode.trim().toUpperCase(),
        department,
        designation,
        community: community || 'N/A',
        password,
        otp: otp.trim(),
      });

      showToast.success('Email verified & account registered! Pending admin approval.');
      setShowOtpModal(false);
      navigate('/login');
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
    <div className="min-h-screen bg-[#edf0f5] p-2.5 sm:p-4 md:p-6 selection:bg-primary-600 selection:text-white flex items-center justify-center">
      {/* Master Dual-Column Container */}
      <div className="w-full max-w-[1360px] bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[760px]">
        
        {/* Left Column: SheKunj-style Branded Showcase Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#023433] via-[#012626] to-[#011415] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl" />

          {/* 1. Top Header: Logo + Navigation Pills */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to={getDashboardPath(user)} className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xs group-hover:scale-105 transition-transform">
                <CalendarHeart size={20} className="text-emerald-300" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                Evently
              </span>
            </Link>

            <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-1 border border-white/15 backdrop-blur-md">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-200 hover:text-white transition"
              >
                Sign In
              </Link>
              <span className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-slate-900 shadow-xs">
                Join Us
              </span>
            </div>
          </div>

          {/* 2. Middle Content: Faculty Value Propositions */}
          <div className="relative z-10 my-8 sm:my-12 space-y-6">
            <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-emerald-300/90 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Faculty & Organizer Desk
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Empower Campus.<br />Publish & Lead.
              </h2>
              <p className="text-sm sm:text-base text-slate-300/90 font-normal leading-relaxed max-w-md">
                Register your faculty credentials to organize hackathons, coordinate academic workshops, and manage DevCorps student communities.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Direct campus event publishing & scheduling</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Live attendee rosters & PDF / CSV analytics export</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Custom dynamic post-event feedback survey builder</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Metric Stats Bar */}
          <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Instant</p>
              <p className="text-[11px] text-slate-300 font-medium">Setup</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Verified</p>
              <p className="text-[11px] text-slate-300 font-medium">Faculty Queue</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Prestige</p>
              <p className="text-[11px] text-slate-300 font-medium">Governance</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-8 sm:py-10 bg-white">
          <div className="w-full max-w-xl mx-auto">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Register as Faculty Organizer
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage and publish campus events for your department.
              </p>
            </div>

            {/* Student / Faculty toggle in Skeuomorphic Tray */}
            <div className="skeuo-tray flex rounded-full p-1 mb-4">
              <button
                type="button"
                onClick={() => navigate('/signup/student')}
                className="flex-1 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                className="skeuo-pill-active flex-1 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-default"
              >
                Faculty
              </button>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 text-xs text-amber-900 mb-4">
              <Info size={15} className="shrink-0 text-amber-700 mt-0.5" />
              <span className="leading-relaxed">Faculty accounts require administrator approval before you can publish campus events.</span>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInitiateSignup} className="space-y-3.5">
              {/* Row: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@bicnepal.edu.np"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row: Phone & Faculty ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98XXXXXXXX"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Faculty ID Code</label>
                  <input
                    type="text"
                    required
                    value={facultyIdCode}
                    onChange={(e) => setFacultyIdCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BIC-FAC-0142"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Department & Designation Cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Department</label>
                  <div className="relative">
                    <select
                      required
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select Department</option>
                      {Object.keys(DEPARTMENT_DESIGNATIONS).map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Designation</label>
                  {isFreeTextDesignation ? (
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Lecturer"
                      className={inputClass}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={!department}
                        className={selectClass}
                      >
                        <option value="">{department ? 'Select Designation' : 'Select Department First'}</option>
                        {designationOptions && designationOptions.map((des) => (
                          <option key={des} value={des}>{des}</option>
                        ))}
                      </select>
                      <ChevronDown className={chevronClass} size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Optional DevCorps Community Selection */}
              {department === 'DevCorps' && (
                <div>
                  <label className={labelClass}>Assigned Tech Community</label>
                  <div className="relative">
                    <select
                      value={community}
                      onChange={(e) => setCommunity(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select Community (Optional)</option>
                      {COMMUNITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>
              )}

              {/* Row: Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="skeuo-input w-full rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
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
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="skeuo-input w-full rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
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

              <p className="text-[11px] text-slate-400 text-center pt-1">
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
                className="skeuo-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                {loading ? 'Validating Faculty Email...' : 'Register Faculty Account'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-5">
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
                <h2 className="text-base font-bold text-slate-900">Verify Your Faculty Email</h2>
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
                Please check your inbox and enter the 6-digit verification code below to submit your faculty registration for admin approval.
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

              {devOtp && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyRound size={14} className="text-emerald-700" />
                    Code: <strong className="font-mono tracking-wider">{devOtp}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="text-emerald-700 hover:text-emerald-900 underline font-semibold text-[11px] cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

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
                  {otpLoading ? 'Verifying...' : 'Verify & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}