import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, CalendarHeart, AlertCircle, Loader2,
  Phone, Landmark, GraduationCap, Layers, BarChart3, CalendarDays, Users,
  CheckCircle2, ChevronDown, X, User, Ban, ShieldAlert
} from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { suggestEmailCorrection } from '../../../shared/utils/emailTypo';
import { getDashboardPath } from '../../../shared/utils/navigation';
import {
  ACADEMIC_STRUCTURE,
  GROUPS,
  getFacultiesForCollege,
  getSemestersForLevel,
  matchAffiliatedCollege,
} from '../../../shared/utils/academicCascade';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deactivatedInfo, setDeactivatedInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Google authentication states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePromptModal, setShowGooglePromptModal] = useState(false);
  const [directGoogleEmail, setDirectGoogleEmail] = useState('');
  const [directGoogleName, setDirectGoogleName] = useState('');

  // Google Sign-Up Profile Completion modal state (for new students)
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [pendingFullName, setPendingFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [courseMajor, setCourseMajor] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [academicSemester, setAcademicSemester] = useState('');
  const [academicGroup, setAcademicGroup] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [modalAvatarError, setModalAvatarError] = useState(false);

  const isAffiliated = pendingGoogleUser?.isAffiliated;
  const facultyOptions = useMemo(
    () => (pendingGoogleUser?.collegeName ? getFacultiesForCollege(pendingGoogleUser.collegeName) : Object.keys(ACADEMIC_STRUCTURE)),
    [pendingGoogleUser]
  );
  const courseOptions = useMemo(
    () => (facultyName && ACADEMIC_STRUCTURE[facultyName] ? Object.keys(ACADEMIC_STRUCTURE[facultyName]) : []),
    [facultyName]
  );
  const levelOptions = useMemo(
    () => (facultyName && courseName && ACADEMIC_STRUCTURE[facultyName]?.[courseName] ? ACADEMIC_STRUCTURE[facultyName][courseName].levels : []),
    [facultyName, courseName]
  );
  const semesterOptions = useMemo(
    () => (academicLevel ? getSemestersForLevel(facultyName, courseName, academicLevel) : []),
    [facultyName, courseName, academicLevel]
  );

  function handleFacultyChange(val) {
    setFacultyName(val);
    setCourseName('');
    setAcademicLevel('');
    setAcademicSemester('');
    setAcademicGroup('');
  }

  function handleCourseChange(val) {
    setCourseName(val);
    setAcademicLevel('');
    setAcademicSemester('');
    setAcademicGroup('');
  }

  function handleLevelChange(val) {
    setAcademicLevel(val);
    setAcademicSemester('');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setDeactivatedInfo(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      showToast.success(`Welcome back, ${res.data.user.full_name}`);
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      if (err.response?.data?.isDeactivated || err.response?.status === 403) {
        setDeactivatedInfo({
          message: err.response?.data?.message || 'Your account has been deactivated by campus administration.',
          reason: err.response?.data?.reason,
        });
        setError('');
      } else {
        setError(err.response?.data?.message || 'Login failed');
        setDeactivatedInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    function renderGoogleButton() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        const btnDiv = document.getElementById('google-btn-container');
        if (btnDiv) {
          btnDiv.innerHTML = '';
          window.google.accounts.id.renderButton(btnDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
            logo_alignment: 'left',
          });
        }
      }
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleGoogleResponse(response) {
    if (!response?.credential) {
      setError('Google authentication failed. Please try again.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    setDeactivatedInfo(null);
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      if (res.data.isNewUser) {
        openProfileCompletion(res.data.googleUser);
      } else {
        login(res.data.user, res.data.token);
        showToast.success(`Welcome back, ${res.data.user.full_name}`);
        navigate(`/${res.data.user.role}/dashboard`);
      }
    } catch (err) {
      if (err.response?.data?.isDeactivated || err.response?.status === 403) {
        setDeactivatedInfo({
          message: err.response?.data?.message || 'Your account has been deactivated by campus administration.',
          reason: err.response?.data?.reason,
        });
        setError('');
      } else {
        setError(err.response?.data?.message || 'Google sign-in failed');
        setDeactivatedInfo(null);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  function openProfileCompletion(googleUser) {
    setPendingGoogleUser(googleUser);
    const initialName =
      googleUser.fullName && !googleUser.fullName.startsWith('np0')
        ? googleUser.fullName
        : '';
    setPendingFullName(initialName);
    setCollegeName(googleUser.collegeName !== 'Guest' ? googleUser.collegeName : '');
    setFacultyName('');
    setCourseName('');
    setAcademicLevel('');
    setAcademicSemester('');
    setAcademicGroup('');
    setPhone('');
    setCourseMajor('');
    setProfileError('');
    setShowGooglePromptModal(false);
  }

  async function handleDirectGoogleAuth(e) {
    e.preventDefault();
    if (!directGoogleEmail.includes('@')) return;

    setGoogleLoading(true);
    setError('');
    setDeactivatedInfo(null);
    try {
      const res = await api.post('/auth/google', {
        demoUser: {
          email: directGoogleEmail.trim().toLowerCase(),
          name: directGoogleName.trim() || directGoogleEmail.split('@')[0],
        },
      });

      if (res.data.isNewUser) {
        openProfileCompletion(res.data.googleUser);
      } else {
        setShowGooglePromptModal(false);
        login(res.data.user, res.data.token);
        showToast.success(`Welcome back, ${res.data.user.full_name}`);
        navigate(`/${res.data.user.role}/dashboard`);
      }
    } catch (err) {
      if (err.response?.data?.isDeactivated || err.response?.status === 403) {
        setDeactivatedInfo({
          message: err.response?.data?.message || 'Your account has been deactivated by campus administration.',
          reason: err.response?.data?.reason,
        });
        setError('');
      } else {
        setError(err.response?.data?.message || 'Google sign-in failed');
        setDeactivatedInfo(null);
      }
      setShowGooglePromptModal(false);
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleClick() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const renderedBtn = document.querySelector('#google-btn-container div[role="button"]');
          if (renderedBtn) {
            renderedBtn.click();
          } else {
            setShowGooglePromptModal(true);
          }
        }
      });
      return;
    }

    setShowGooglePromptModal(true);
  }

  async function handleCompleteGoogleSignup(e) {
    e.preventDefault();
    setProfileError('');

    if (!pendingFullName.trim()) {
      setProfileError('Please enter your full legal name');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || !/^9\d{9}$/.test(cleanPhone)) {
      setProfileError('Please enter a valid 10-digit phone number (starting with 9)');
      return;
    }
    if (!collegeName.trim()) {
      setProfileError('Please enter your college name');
      return;
    }

    if (isAffiliated) {
      if (!facultyName || !courseName || !academicLevel || !academicSemester || !academicGroup) {
        setProfileError('Please complete all academic details');
        return;
      }
    } else {
      const affiliatedCheck = matchAffiliatedCollege(collegeName);
      if (affiliatedCheck) {
        const fullCollege =
          affiliatedCheck === 'BIC'
            ? 'Biratnagar International College'
            : affiliatedCheck === 'Herald'
            ? 'Herald College Kathmandu'
            : 'Fishtail Academy';
        const domainExample =
          affiliatedCheck === 'BIC'
            ? '@bicnepal.edu.np'
            : affiliatedCheck === 'Herald'
            ? '@heraldcollege.edu.np'
            : '@fishtail.edu.np';
        setProfileError(
          `Students of ${fullCollege} must sign in using their official college email (${domainExample}). For personal/guest accounts, please enter your external college name.`
        );
        return;
      }

      if (!courseMajor.trim()) {
        setProfileError('Please enter your course or major');
        return;
      }
    }

    setProfileLoading(true);
    try {
      const res = await api.post('/auth/google/complete-profile', {
        googleUser: pendingGoogleUser,
        fullName: pendingFullName.trim(),
        phone: cleanPhone,
        collegeName: collegeName.trim(),
        facultyName: isAffiliated ? facultyName : undefined,
        courseName: isAffiliated ? courseName : undefined,
        academicLevel: isAffiliated ? academicLevel : undefined,
        academicSemester: isAffiliated ? academicSemester : undefined,
        academicGroup: isAffiliated ? academicGroup : undefined,
        courseMajor: !isAffiliated ? courseMajor.trim() : undefined,
      });

      login(res.data.user, res.data.token);
      showToast.success('Account created successfully! Welcome to Evently.');
      setPendingGoogleUser(null);
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setProfileLoading(false);
    }
  }

  const inputClass =
    'w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition';
  const selectClass =
    'w-full appearance-none border border-slate-200 bg-white rounded-xl px-3.5 pr-8 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-3 py-6">
      <div className="skeuo-card w-full max-w-sm rounded-2xl p-6 sm:p-8">
        <Link to={getDashboardPath(user)} className="inline-flex items-center gap-2 mb-5 hover:opacity-90 transition group">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <CalendarHeart className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Evently</span>
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Welcome back</h1>
        <p className="text-xs text-slate-500 mb-5">Enter your credentials to access your account</p>

        {deactivatedInfo && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/95 p-4 text-xs text-rose-950 shadow-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mt-0.5">
                <Ban size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 text-sm">Account Deactivated</h4>
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  {deactivatedInfo.message || 'Your account has been deactivated by campus administration.'}
                </p>
              </div>
            </div>
            {deactivatedInfo.reason && (
              <div className="rounded-xl bg-white/90 p-2.5 border border-rose-200/80 text-xs">
                <strong className="text-rose-900 block mb-0.5">Reason for Deactivation:</strong>
                <span className="text-rose-700 font-medium">{deactivatedInfo.reason}</span>
              </div>
            )}
            <p className="text-[11px] text-rose-600/90 pt-0.5">
              If you believe this is an error, please contact campus administration at{' '}
              <a href="mailto:evently.nexora@gmail.com" className="font-semibold underline hover:text-rose-900">
                evently.nexora@gmail.com
              </a>.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailSuggestion(suggestEmailCorrection(e.target.value));
              }}
              className="skeuo-input w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="you@university.edu"
            />
            {emailSuggestion && (
              <button
                type="button"
                onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(null); }}
                className="text-[11px] text-amber-700 mt-1 hover:underline block"
              >
                Did you mean <span className="font-semibold">{emailSuggestion}</span>?
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="skeuo-input w-full rounded-xl px-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs text-primary-700 font-semibold hover:underline">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="skeuo-btn-primary w-full py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400">or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="relative h-[42px] w-full">
          {/* Permanent visible custom button that never jumps or shifts */}
          <button
            id="google-custom-btn"
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || loading}
            className="skeuo-btn-secondary w-full h-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin text-slate-500" size={16} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5c-8 0-14.9 4.6-18.3 11.2z"/>
                <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.5c-2 1.5-4.7 2.4-7.6 2.4-5.4 0-9.9-3.1-11.4-7.6l-6.6 5.1C9 40 16 44.5 24 44.5z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.5 36.6 44.5 30.8 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Invisible Google official button on top to trigger native auth */}
          <div
            id="google-btn-container"
            className="absolute inset-0 w-full h-full opacity-[0.001] overflow-hidden pointer-events-auto flex items-center justify-center z-10 cursor-pointer"
          />
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Don't have an account?{' '}
          <Link to="/signup/student" className="text-primary-700 font-bold hover:underline">Sign up here</Link>
        </p>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <Link to="/terms" className="hover:text-slate-600 transition hover:underline">
            Terms & Conditions
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-slate-600 transition hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>

      {/* Google Account Authentication Prompt Modal (when testing directly or without GIS client ID) */}
      {showGooglePromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5c-8 0-14.9 4.6-18.3 11.2z"/>
                <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.5c-2 1.5-4.7 2.4-7.6 2.4-5.4 0-9.9-3.1-11.4-7.6l-6.6 5.1C9 40 16 44.5 24 44.5z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.5 36.6 44.5 30.8 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
              </svg>
              <div>
                <h2 className="text-base font-bold text-slate-900">Sign in with Google</h2>
                <p className="text-xs text-slate-500">Authenticate with your Google or college account</p>
              </div>
            </div>

            <form onSubmit={handleDirectGoogleAuth} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google / College Email Address
                </label>
                <input
                  type="email"
                  required
                  value={directGoogleEmail}
                  onChange={(e) => setDirectGoogleEmail(e.target.value)}
                  placeholder="np02cs4a250103@bicnepal.edu.np"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={directGoogleName}
                  onChange={(e) => setDirectGoogleName(e.target.value)}
                  placeholder="e.g. Nasad Mansuri"
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGooglePromptModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!directGoogleEmail.includes('@') || googleLoading}
                  className="bg-primary-700 hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {googleLoading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sign-Up Profile Completion Modal (Academic Details for BIC / Herald / Fishtail / Guest) */}
      {pendingGoogleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-base shrink-0 overflow-hidden relative border border-primary-200">
                  {pendingGoogleUser.avatarUrl && !modalAvatarError ? (
                    <img
                      src={pendingGoogleUser.avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setModalAvatarError(true)}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{(pendingFullName || pendingGoogleUser.fullName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Complete Your Student Profile</h2>
                  <p className="text-xs text-slate-500">
                    Signing up as <span className="font-semibold text-slate-800">{pendingGoogleUser.email}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGoogleUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Affiliation Banner */}
            <div className="mt-4 mb-4 p-3 rounded-xl bg-primary-50/70 border border-primary-100">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-900">
                <CheckCircle2 size={16} className="text-primary-700 shrink-0" />
                {isAffiliated ? (
                  <span>Wolverhampton-Affiliated Student ({pendingGoogleUser.collegeName})</span>
                ) : (
                  <span>External Student (Guest Participant)</span>
                )}
              </div>
              <p className="text-[11px] text-primary-800 mt-1">
                {isAffiliated
                  ? "Since your Google account is from an affiliated college, please enter your legal name, phone, and academic details."
                  : "Please provide your legal name, phone, college name, and major to participate in campus events."}
              </p>
            </div>

            {profileError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {profileError}
              </div>
            )}

            <form onSubmit={handleCompleteGoogleSignup} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className={labelClass}>Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={pendingFullName}
                  onChange={(e) => setPendingFullName(e.target.value)}
                  placeholder="e.g. Nasad Mansuri"
                  className={inputClass}
                />
              </div>

              {/* Phone Number */}
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

              {/* College Name */}
              <div>
                <label className={labelClass}>College Name</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  readOnly={isAffiliated}
                  className={`${inputClass} ${isAffiliated ? 'bg-slate-100 text-slate-700 font-medium cursor-not-allowed' : ''}`}
                  placeholder={isAffiliated ? 'Biratnagar International College' : 'e.g. Adarsha College, Tribhuvan University...'}
                />
              </div>

              {/* Affiliated Wolverhampton Student Fields */}
              {isAffiliated ? (
                <>
                  <div>
                    <label className={labelClass}>Faculty</label>
                    <div className="relative">
                      <select
                        required
                        value={facultyName}
                        onChange={(e) => handleFacultyChange(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select faculty</option>
                        {facultyOptions.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <ChevronDown className={chevronClass} size={14} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Course</label>
                    <div className="relative">
                      <select
                        required
                        value={courseName}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        disabled={!facultyName}
                        className={selectClass}
                      >
                        <option value="">{facultyName ? 'Select course' : 'Select faculty first'}</option>
                        {courseOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className={chevronClass} size={14} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className={labelClass}>Level</label>
                      <div className="relative">
                        <select
                          required
                          value={academicLevel}
                          onChange={(e) => handleLevelChange(e.target.value)}
                          disabled={!courseName}
                          className={selectClass}
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
                      <label className={labelClass}>Semester</label>
                      <div className="relative">
                        <select
                          required
                          value={academicSemester}
                          onChange={(e) => setAcademicSemester(e.target.value)}
                          disabled={!academicLevel}
                          className={selectClass}
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
                      <label className={labelClass}>Group</label>
                      <div className="relative">
                        <select
                          required
                          value={academicGroup}
                          onChange={(e) => setAcademicGroup(e.target.value)}
                          disabled={!academicSemester}
                          className={selectClass}
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
                </>
              ) : (
                /* Guest Student Field */
                <div>
                  <label className={labelClass}>Course / Major</label>
                  <input
                    type="text"
                    required
                    value={courseMajor}
                    onChange={(e) => setCourseMajor(e.target.value)}
                    placeholder="e.g. BSc Computer Science, MBA, BBA"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  {profileLoading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                  {profileLoading ? 'Creating Account & Profile...' : 'Complete Registration & Enter Evently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}