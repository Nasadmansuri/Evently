import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User, Mail, Phone, IdCard, Landmark, Briefcase, Users, Lock, ShieldCheck,
  UserPlus, Info, AlertCircle, Loader2, Eye, EyeOff, CalendarHeart, ChevronDown, CheckCircle2,
  KeyRound, X, RefreshCw, ArrowRight,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';

export default function FacultySignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoleSwitch = Boolean(location.state?.fromRoleSwitch);
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
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#edf0f5] p-2.5 sm:p-3 md:p-4 selection:bg-primary-600 selection:text-white flex items-center justify-center overflow-y-auto lg:overflow-hidden">
      {/* Master Dual-Column Container */}
      <div className="w-full max-w-[1400px] h-auto lg:h-[calc(100vh-2.5rem)] max-h-[860px] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Wider Evently Brand Showcase Inset Card (lg:col-span-7) */}
        <div className="lg:col-span-7 m-2.5 sm:m-3 lg:m-3.5 rounded-[22px] sm:rounded-[28px] bg-gradient-to-br from-[#023433] via-[#012626] to-[#011415] text-white p-7 sm:p-9 lg:p-12 flex flex-col justify-between relative overflow-hidden shadow-lg border border-emerald-900/40">
          {/* Flashlight Beam Sweep Effect - Only on Sign In / Join Us navigation */}
          {!isRoleSwitch && <div className="animate-flashlight" />}

          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

          {/* 1. Top Header: Logo + Navigation Pills (Stays solid & constant) */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
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
                className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-200 hover:text-white transition"
              >
                Sign In
              </Link>
              <span className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-slate-900 shadow-xs">
                Join Us
              </span>
            </div>
          </div>

          {/* 2. Middle Content: Faculty Value Propositions (Slides up from bottom) */}
          <div className="relative z-10 my-auto py-6 sm:py-8 space-y-5">
            <div className="space-y-2 animate-slide-up">
              <span className="inline-block text-[10.5px] font-extrabold tracking-widest uppercase text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                Faculty & Organizer Desk
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white mt-2">
                Empower Campus.<br />Publish & Lead.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md mt-2">
                Register your faculty credentials to organize hackathons, coordinate academic workshops, and manage DevCorps student communities.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2 animate-slide-up-delay-1">
              <div className="flex items-center gap-3 text-xs sm:text-[13.5px] text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Direct campus event publishing & scheduling</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-[13.5px] text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Live attendee rosters & PDF / CSV analytics export</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-[13.5px] text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                </div>
                <span>Custom dynamic post-event feedback survey builder</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Metric Stats Bar */}
          <div className="relative z-10 pt-5 border-t border-white/15 grid grid-cols-3 gap-4 animate-slide-up-delay-2">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Instant</p>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">Setup</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Verified</p>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">Faculty Queue</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">Prestige</p>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">Governance</p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Form Container (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-center px-6 sm:px-8 lg:px-10 py-4 sm:py-6 h-full max-w-[480px] mx-auto w-full overflow-y-auto no-scrollbar">
          <div className="w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="mb-4 animate-slide-up">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Register as Faculty
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage and publish campus events for your department.
              </p>
            </div>

            {/* Student / Faculty toggle in Skeuomorphic Tray */}
            <div className="skeuo-tray flex rounded-full p-1 mb-4 animate-slide-up">
              <button
                type="button"
                onClick={() => navigate('/signup/student', { state: { fromRoleSwitch: true } })}
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

            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/80 py-2 px-3 text-xs text-amber-900 mb-3 animate-slide-up">
              <Info size={15} className="shrink-0 text-amber-700" />
              <span className="leading-relaxed">Faculty accounts require administrator approval before publishing events.</span>
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
                    placeholder="e.g. Dr. John Doe"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@bicnepal.edu.np"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row: Phone & Faculty ID */}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty ID Code</label>
                  <input
                    type="text"
                    required
                    value={facultyIdCode}
                    onChange={(e) => setFacultyIdCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BIC-FAC-0142"
                    className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Department & Designation Cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <div className="relative">
                    <select
                      required
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="skeuo-input w-full appearance-none rounded-xl px-3.5 pr-8 py-2 text-sm text-slate-900 disabled:opacity-50"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  {isFreeTextDesignation ? (
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Lecturer"
                      className="skeuo-input w-full rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={!department}
                        className="skeuo-input w-full appearance-none rounded-xl px-3.5 pr-8 py-2 text-sm text-slate-900 disabled:opacity-50"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Tech Community</label>
                  <div className="relative">
                    <select
                      value={community}
                      onChange={(e) => setCommunity(e.target.value)}
                      className="skeuo-input w-full appearance-none rounded-xl px-3.5 pr-8 py-2 text-sm text-slate-900 disabled:opacity-50"
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
                {loading ? 'Validating Faculty Email...' : 'Register Faculty Account'}
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