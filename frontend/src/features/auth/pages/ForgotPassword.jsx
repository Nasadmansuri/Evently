import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, ArrowLeft, CalendarHeart, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
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
        email: email.trim(),
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-3 py-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
        <Link to={getDashboardPath(user)} className="inline-flex items-center gap-2 mb-5 hover:opacity-90 transition group">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <CalendarHeart className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Evently</span>
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
          {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
        </h1>
        <p className="text-xs text-slate-500 mb-5">
          {step === 1
            ? 'Enter your registered email to receive a 6-digit verification code.'
            : `Enter the 6-digit code sent to ${email} along with your new password.`}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                placeholder="you@university.edu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 active:bg-primary-900 hover:shadow-lg hover:shadow-primary-700/20 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
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
                  className="text-emerald-700 hover:text-emerald-900 underline font-semibold text-[11px]"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                placeholder="123456"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-700 hover:bg-primary-800 active:bg-primary-900 hover:shadow-lg hover:shadow-primary-700/20 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              {loading ? 'Resetting password...' : 'Reset Password'}
              {!loading && <CheckCircle2 size={16} />}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
            >
              Request a new code
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-primary-700 hover:underline font-bold">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
