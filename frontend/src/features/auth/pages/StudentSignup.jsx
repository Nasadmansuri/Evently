import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Landmark, GraduationCap, Lock, ShieldCheck,
  UserPlus, Layers, BarChart3, CalendarDays, Users, CheckCircle2, UserCircle, AlertCircle,
  Loader2, Eye, EyeOff, CalendarHeart, ChevronDown,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { ACADEMIC_STRUCTURE, GROUPS, matchAffiliatedCollege, getFacultiesForCollege, getSemestersForLevel } from '../../../shared/utils/academicCascade';
import { showToast } from '../../../shared/utils/toast';

export default function StudentSignup() {
  const navigate = useNavigate();

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (!collegeName.trim()) return setError('Please enter your college name');
    if (!/^9\d{9}$/.test(phone)) {
      return setError('Please enter a valid 10-digit Nepali phone number (starting with 9)');
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
      await api.post('/auth/signup/student', {
        fullName, email, phone, collegeName,
        courseMajor: isBic ? undefined : courseMajor,
        facultyName: isBic ? facultyName : undefined,
        courseName: isBic ? courseName : undefined,
        academicLevel: isBic ? academicLevel : undefined,
        academicSemester: isBic ? academicSemester : undefined,
        academicGroup: isBic ? academicGroup : undefined,
        password,
      });
      showToast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-slate-200 bg-slate-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const selectClass =
    'w-full appearance-none border border-slate-200 bg-slate-50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-medium text-slate-700 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-3 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-7">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <CalendarHeart className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-slate-900">Evently</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-0.5">Create your account</h1>
          <p className="text-xs text-slate-500">Join Evently and never miss a campus event.</p>
        </div>

        {/* Student / Faculty toggle */}
        <div className="flex bg-slate-100 rounded-full p-1 mb-4">
          <button
            type="button"
            className="flex-1 py-1.5 rounded-full text-xs font-medium bg-white shadow text-primary-600"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup/faculty')}
            className="flex-1 py-1.5 rounded-full text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            Faculty
          </button>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className={iconClass} size={16} />
                <input
                  type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Alex Smith"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className={iconClass} size={16} />
                <input
                  type="text" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="alex@bic.edu.np"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className={iconClass} size={16} />
                <input
                  type="text" required value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  className={inputClass}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>College Name</label>
              <div className="relative">
                <Landmark className={iconClass} size={16} />
                <input
                  type="text" required value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. BIC, Herald, Fishtail..."
                  autoComplete="off"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                We'll auto-detect if you're at BIC, Herald, or Fishtail Mountain College.
              </p>
            </div>
          </div>

          {collegeName.trim() && (
            <div>
              {isBic ? (
                <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> {matchedCollegeName} Student — Academic Details
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <UserCircle size={13} /> Guest Participant
                </span>
              )}
              <p className="text-xs text-slate-400 italic mt-1.5">
                {isBic
                  ? `Since you're at ${matchedCollegeName}, we'll match your academic details automatically.`
                  : "Since you're not at an affiliated college, we just need to know what you study."}
              </p>
            </div>
          )}

          {collegeName.trim() && !isBic && (
            <div>
              <label className={labelClass}>Course / Major</label>
              <div className="relative">
                <GraduationCap className={iconClass} size={16} />
                <input
                  type="text" required value={courseMajor}
                  onChange={(e) => setCourseMajor(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. BSc Computer Science, MBA, etc."
                />
              </div>
            </div>
          )}

          {collegeName.trim() && isBic && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Faculty</label>
                  <div className="relative">
                    <Layers className={iconClass} size={16} />
                    <select required value={facultyName} onChange={(e) => handleFacultyChange(e.target.value)} className={selectClass}>
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
                    <GraduationCap className={iconClass} size={16} />
                    <select required value={courseName} disabled={!facultyName} onChange={(e) => handleCourseChange(e.target.value)} className={selectClass}>
                      <option value="">{facultyName ? 'Select course' : 'Select faculty first'}</option>
                      {courseOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Level</label>
                  <div className="relative">
                    <BarChart3 className={iconClass} size={16} />
                    <select required value={academicLevel} disabled={!courseName} onChange={(e) => handleLevelChange(e.target.value)} className={selectClass}>
                      <option value="">Select level</option>
                      {levelOptions.map((l) => (
                        <option key={l} value={l}>Level {l}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Semester</label>
                  <div className="relative">
                    <CalendarDays className={iconClass} size={16} />
                    <select required value={academicSemester} disabled={!academicLevel} onChange={(e) => setAcademicSemester(e.target.value)} className={selectClass}>
                      <option value="">Select semester</option>
                      {semesterOptions.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Group</label>
                  <div className="relative">
                    <Users className={iconClass} size={16} />
                    <select required value={academicGroup} disabled={!courseName} onChange={(e) => setAcademicGroup(e.target.value)} className={selectClass}>
                      <option value="">Select group</option>
                      {GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronDown className={chevronClass} size={14} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <Lock className={iconClass} size={16} />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-9`}
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className={`text-[11px] mt-1 flex items-center gap-1 transition-colors ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {password.length >= 8 ? <CheckCircle2 size={12} /> : null}
                At least 8 characters
              </p>
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <ShieldCheck className={iconClass} size={16} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-9`}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-[11px] mt-1 flex items-center gap-1 ${confirmPassword === password ? 'text-emerald-600' : 'text-red-500'}`}>
                  {confirmPassword === password ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 leading-snug">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}