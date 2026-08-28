import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft, CalendarHeart, AlertCircle,
  CheckCircle2, Loader2, ShieldCheck,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { getDashboardPath } from '../../../shared/utils/navigation';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Request Code, 2: Reset with OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  async function handleRequestCode(e) {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.data.devOtp) {
        setDevCode(res.data.devOtp);
      }
      showToast.success(res.data.message || 'Verification code sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      showToast.success(res.data.message || 'Password reset successfully');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#edf0f5] p-2.5 sm:p-4 md:p-6 selection:bg-primary-600 selection:text-white flex items-center justify-center">
      {/* Master Dual-Column Container */}
      <div className="w-full max-w-[1360px] bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[740px]">
        
        {/* Left Column: SheKunj-style Branded Showcase Panel */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#023433] via-[#012626] to-[#011415] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Glows */}
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
              <Link
                to="/signup/student"
                className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-slate-900 shadow-xs"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* 2. Middle Content: Security Recovery Value Props */}
          <div className="relative z-10 my-10 sm:my-14 space-y-6">
            <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-emerald-300/90 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Account Security & Recovery
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Secure Password <br className="hidden sm:inline" />Recovery.
              </h2>
              <p className="text-sm sm:text-base text-slate-300/90 font-normal leading-relaxed max-w-md">
                Regain fast, encrypted access to your Evently account with one-time verification codes sent directly to your inbox.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={13} />
                </div>
                <span>Encrypted 6-digit OTP delivery to registered email</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={13} />
                </div>
                <span>Bcrypt cryptographic password hashing</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={13} />
                </div>
                <span>Instant re-entry to your campus event dashboard</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Metric Stats Bar */}
          <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">256-bit</p>
              <p className="text-[11px] text-slate-300 font-medium">Encryption</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">15 Min</p>
              <p className="text-[11px] text-slate-300 font-medium">Code Validity</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">24 / 7</p>
              <p className="text-[11px] text-slate-300 font-medium">Account Access</p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Form Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 sm:py-12 bg-white">
          <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {step === 1
                  ? 'Enter your registered email to receive a 6-digit verification code.'
                  : `Enter the 6-digit code sent to ${email} along with your new password.`}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="skeuo-input w-full rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="you@bicnepal.edu.np"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="skeuo-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {devCode && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-medium">
                      <KeyRound size={14} className="text-emerald-700" />
                      Code: <strong className="font-mono tracking-wider">{devCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(devCode)}
                      className="text-emerald-700 hover:text-emerald-900 underline font-semibold text-[11px] cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="skeuo-input w-full rounded-xl px-4 py-2.5 text-base tracking-widest font-mono text-center"
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="skeuo-input w-full rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="skeuo-input w-full rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="skeuo-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                  {loading ? 'Resetting password...' : 'Reset Password'}
                  {!loading && <CheckCircle2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="skeuo-btn-secondary w-full py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} /> Change email / resend code
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <Link to="/login" className="text-xs font-semibold text-primary-700 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
