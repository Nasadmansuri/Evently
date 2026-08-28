import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, IdCard, Landmark, Briefcase, Users, Lock, ShieldCheck,
  UserPlus, Info, AlertCircle, Loader2, Eye, EyeOff, CalendarHeart, ChevronDown, CheckCircle2,
  KeyRound, X, RefreshCw,
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
    'w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition';
  const selectClass =
    'w-full appearance-none border border-slate-200 bg-white rounded-xl px-3.5 pr-9 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-3 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-7">
        <div className="flex flex-col items-center text-center mb-4">
          <Link to={getDashboardPath(user)} className="inline-flex items-center gap-2 mb-3 hover:opacity-90 transition group">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <CalendarHeart className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Evently</span>
          </Link>
          <h1 className="text-xl font-black tracking-tight text-slate-900 mb-0.5">Create your account</h1>
          <p className="text-xs text-slate-500">Join Evently and never miss a campus event.</p>
        </div>

        <div className="flex bg-slate-100 rounded-full p-1 mb-4">
          <button
            type="button"
            onClick={() => navigate('/signup/student')}
            className="flex-1 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-700 transition"
          >
            Student
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 rounded-full text-xs font-bold bg-white shadow-xs text-primary-700"
          >
            Faculty
          </button>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 text-xs text-amber-900 mb-3">
          <Info size={15} className="shrink-0 text-amber-700 mt-0.5" />
          <span className="leading-relaxed">Faculty accounts require administrator approval before you can publish campus events.</span>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleInitiateSignup} className="space-y-3">
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
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@college.edu.np"
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
              <label className={labelClass}>Faculty ID</label>
              <input
                type="text"
                required
                value={facultyIdCode}
                onChange={(e) => setFacultyIdCode(e.target.value)}
                placeholder="e.g. BIC-FAC-0142"
                className={inputClass}
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className={labelClass}>Department</label>
            <div className="relative">
              <select
                required
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select department</option>
                {Object.keys(DEPARTMENT_DESIGNATIONS).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className={chevronClass} size={14} />
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className={labelClass}>Designation</label>
            {isFreeTextDesignation ? (
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. IT Officer, Lab Assistant..."
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
                  <option value="">{department ? 'Select designation' : 'Select department first'}</option>
                  {(designationOptions || []).map((des) => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
                <ChevronDown className={chevronClass} size={14} />
              </div>
            )}
          </div>

          {/* DevCorps Community (Only when DevCorps is selected) */}
          {department === 'DevCorps' && (
            <div>
              <label className={labelClass}>DevCorps Community</label>
              <div className="relative">
                <select
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select DevCorps Community</option>
                  {COMMUNITIES.filter((c) => c !== 'N/A').map((c) => (
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
                  className="w-full border border-slate-200 bg-white rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
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
                  className="w-full border border-slate-200 bg-white rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className={password.length >= 8 ? 'text-primary-700 font-semibold' : ''}>
              {password.length >= 8 ? '✓' : '○'} At least 8 characters
            </span>
            <span
              className={
                confirmPassword && password === confirmPassword
                  ? 'text-primary-700 font-semibold'
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
            className="w-full bg-primary-700 hover:bg-primary-800 active:bg-primary-900 hover:shadow-lg hover:shadow-primary-700/20 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
            {loading ? 'Validating Email...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-700 font-bold hover:underline">
            Sign in here
          </Link>
        </p>
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-primary-50/70 border border-primary-100 text-xs text-primary-900">
              <p className="text-[11px] text-primary-800">
                Please check your inbox and enter the 6-digit verification code below to complete your registration.
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
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full text-center tracking-[8px] text-xl font-bold font-mono py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-primary-700 hover:text-primary-800 font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
                <span className="text-[11px] text-slate-400 font-medium">Valid for 15 minutes</span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className={`w-full font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
                    otp.length === 6 && !otpLoading
                      ? 'bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {otpLoading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                  <span>{otpLoading ? 'Verifying...' : 'Verify Email & Complete Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}