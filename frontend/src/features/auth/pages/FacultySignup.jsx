import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, IdCard, Landmark, Briefcase, Users, Lock, ShieldCheck,
  UserPlus, Info, AlertCircle, Loader2, Eye, EyeOff, CalendarHeart, ChevronDown,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';

export default function FacultySignup() {
  const navigate = useNavigate();

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

  const designationOptions = useMemo(
    () => (department ? DEPARTMENT_DESIGNATIONS[department] : null),
    [department]
  );
  const isFreeTextDesignation = department && designationOptions === null;

  function handleDepartmentChange(value) {
    setDepartment(value);
    setDesignation('');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name');
    if (!isValidEmail(email)) return setError('Please enter a valid email address');
    if (phone && !/^9\d{9}$/.test(phone)) {
      return setError('Please enter a valid 10-digit Nepali phone number (starting with 9)');
    }
    if (!/^[A-Z]{2,5}-[A-Z]{2,5}-\d{3,5}$/i.test(facultyIdCode.trim())) {
      return setError('Faculty ID should look like BIC-FAC-0142');
    }
    if (!department) return setError('Please select your department');
    if (!designation.trim()) return setError('Please select or enter your designation');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/signup/faculty', {
        fullName, email, phone, facultyIdCode,
        department, designation,
        community: community || 'N/A',
        password,
      });
      showToast.success('Registration successful! Your account is pending admin approval.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const selectClass =
    'w-full appearance-none border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-3 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-7">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <CalendarHeart className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">Evently</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">Create your account</h1>
          <p className="text-xs text-gray-500">Join Evently and never miss a campus event.</p>
        </div>

        <div className="flex bg-gray-100 rounded-full p-1 mb-4">
          <button
            type="button"
            onClick={() => navigate('/signup/student')}
            className="flex-1 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Student
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 rounded-full text-xs font-medium bg-white shadow text-primary-600"
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
                  autoComplete="name"
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
                  placeholder="Alex@bic.edu.np"
                  autoComplete="email"
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
                  type="text" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  className={inputClass}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Faculty ID</label>
              <div className="relative">
                <IdCard className={iconClass} size={16} />
                <input
                  type="text" required value={facultyIdCode}
                  onChange={(e) => setFacultyIdCode(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. BIC-FAC-0142"
                  autoComplete="off"
                  name="faculty-id-field"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Department</label>
            <div className="relative">
              <Landmark className={iconClass} size={16} />
              <select
                required value={department}
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

          <div>
            <label className={labelClass}>Designation</label>
            {isFreeTextDesignation ? (
              <div className="relative">
                <Briefcase className={iconClass} size={16} />
                <input
                  type="text" required value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your designation"
                />
              </div>
            ) : (
              <div className="relative">
                <Briefcase className={iconClass} size={16} />
                <select
                  required value={designation} disabled={!department}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={selectClass}
                >
                  <option value="">{department ? 'Select designation' : 'Select department first'}</option>
                  {(designationOptions || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className={chevronClass} size={14} />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Community</label>
            <div className="relative">
              <Users className={iconClass} size={16} />
              <select
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                className={selectClass}
              >
                <option value="">Select community (optional)</option>
                {COMMUNITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className={chevronClass} size={14} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              BIC DevCorps communities organize campus events — select yours if applicable.
            </p>
          </div>

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
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">At least 8 characters</p>
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
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Your account will be reviewed by an admin before you can create or manage events.
            </p>
          </div>

          <p className="text-center text-[11px] text-gray-400 leading-snug">
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

        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}