import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Landmark, GraduationCap, Layers, BarChart3, CalendarDays,
  Users, ShieldCheck, CheckCircle2, Award, Sparkles, Edit3, Save, X, Loader2,
  Calendar, IdCard, Building, MessageSquare, AlertCircle, Copy, Check, Info
} from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { GROUPS } from '../../../shared/utils/academicCascade';

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(authUser || null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Edit form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [academicSemester, setAcademicSemester] = useState('');
  const [academicGroup, setAcademicGroup] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      setProfile(res.data);
      setFullName(res.data.full_name || '');
      setPhone(res.data.phone || '');
      setAcademicSemester(res.data.academic_semester || '1');
      setAcademicGroup(res.data.academic_group || 'G1');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyEmail() {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      showToast.success('Email copied to clipboard');
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setEditError('');

    if (!fullName.trim()) {
      setEditError('Please enter your full name');
      return;
    }

    const cleanPhone = phone.trim();
    if (cleanPhone && !/^9\d{9}$/.test(cleanPhone)) {
      setEditError('Phone number must be exactly 10 digits starting with 9');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        fullName: fullName.trim(),
        phone: cleanPhone || null,
        academicSemester: academicSemester || undefined,
        academicGroup: academicGroup || undefined,
      });

      setProfile(res.data.user);
      updateUser(res.data.user);
      showToast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const isAffiliated =
    profile?.is_affiliated ||
    (profile?.role === 'student' && (
      profile?.college_name?.toLowerCase().includes('biratnagar') ||
      profile?.college_name?.toLowerCase().includes('bic') ||
      profile?.college_name?.toLowerCase().includes('herald') ||
      profile?.college_name?.toLowerCase().includes('fishtail') ||
      profile?.faculty_name ||
      profile?.course_name
    ));
  const isGuest = profile?.role === 'student' && !isAffiliated;
  const isDefaultIdName =
    profile?.full_name &&
    (/^np\d{2}/i.test(profile.full_name) || profile.full_name === profile.email?.split('@')[0]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Name Prompt Banner if student name is set to email username / ID */}
      {isDefaultIdName && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Info size={18} />
            </div>
            <div>
              <p className="text-xs font-bold">Your display name is currently set to your student ID ({profile.full_name})</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Set your full legal name so it displays properly on event certificates and attendance lists.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm shrink-0"
          >
            Set Your Real Name
          </button>
        </div>
      )}

      {/* Hero Header Card - High Contrast Deep Teal Dark Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#023433] text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 border border-[#035352]">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary-400/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              {profile?.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarError(true)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#035352] border border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {profile?.google_id && (
                <div
                  title="Verified via Google Identity"
                  className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-full shadow-md border border-slate-200 flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5c-8 0-14.9 4.6-18.3 11.2z"/>
                    <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.5c-2 1.5-4.7 2.4-7.6 2.4-5.4 0-9.9-3.1-11.4-7.6l-6.6 5.1C9 40 16 44.5 24 44.5z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.5 36.6 44.5 30.8 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
                  </svg>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile?.full_name}
                </h1>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full capitalize ${
                  isGuest
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {isGuest ? 'Guest Account' : profile?.role}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-200">
                <span className="font-mono">{profile?.email}</span>
                <button
                  onClick={handleCopyEmail}
                  className="text-slate-300 hover:text-white transition p-0.5 rounded hover:bg-white/10"
                  title="Copy email"
                >
                  {copiedEmail ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs">
                {profile?.college_name && (
                  <span className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1 rounded-lg text-slate-100 font-medium flex items-center gap-1.5">
                    <Landmark size={13} className="text-primary-300 shrink-0" />
                    {profile.college_name}
                  </span>
                )}
                {isAffiliated && (
                  <span className="bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Wolverhampton Affiliated
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 shadow-md"
          >
            <Edit3 size={14} className="text-primary-600" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left 2 Columns: Academic and Contact Information */}
        <div className="md:col-span-2 space-y-5">
          {/* Academic & Institutional Details Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                Academic & Institutional Details
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isGuest ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {profile?.role === 'student' ? (isGuest ? 'Guest Profile' : 'Student Profile') : profile?.role === 'faculty' ? 'Faculty Profile' : 'Admin Profile'}
              </span>
            </div>

            {profile?.role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                    Institution / College
                  </span>
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Landmark size={15} className="text-primary-600 shrink-0" />
                    {profile.college_name || 'Not Specified'}
                  </span>
                </div>

                {isAffiliated ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                        Faculty / School
                      </span>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Layers size={15} className="text-primary-600 shrink-0" />
                        {profile.faculty_name || 'School of Architecture, Computing and Engineering'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                        Course / Programme
                      </span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <GraduationCap size={16} className="text-primary-600 shrink-0" />
                        {profile.course_name || 'BSc (Hons) Computer Science'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                        Academic Level
                      </span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <BarChart3 size={15} className="text-primary-600 shrink-0" />
                        Level {profile.academic_level || '4'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                        Semester & Group
                      </span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <CalendarDays size={15} className="text-primary-600 shrink-0" />
                        Semester {profile.academic_semester || '1'} · {profile.academic_group || 'G1'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                      Major / Course
                    </span>
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <GraduationCap size={16} className="text-primary-600 shrink-0" />
                      {profile.course_major || 'General Participant'}
                    </span>
                  </div>
                )}
              </div>
            ) : profile?.role === 'faculty' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                    Faculty ID
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <IdCard size={15} className="text-primary-600 shrink-0" />
                    {profile.faculty_id_code || 'FAC-0001'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                    Designation
                  </span>
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Award size={15} className="text-primary-600 shrink-0" />
                    {profile.designation || 'Lecturer'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                    Department
                  </span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building size={15} className="text-primary-600 shrink-0" />
                    {profile.department || 'School of Architecture, Computing and Engineering'}
                  </span>
                </div>

                {profile.community && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                      Community / Club
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Users size={15} className="text-primary-600 shrink-0" />
                      {profile.community}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-primary-50 text-primary-900 text-xs font-semibold">
                System Administrator Account with full access to event approvals, user management, and platform analytics.
              </div>
            )}
          </div>

          {/* Contact & Authentication Security Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base border-b border-slate-100 pb-3.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              Contact & Authentication Security
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                  Email Address
                </span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <Mail size={15} className="text-emerald-600 shrink-0" />
                  {profile?.email}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-2">
                  ✓ Verified Account
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">
                  Phone Number
                </span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Phone size={15} className="text-primary-600 shrink-0" />
                  {profile?.phone || 'Not provided'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-2">
                  {profile?.phone ? 'Primary Contact Number' : 'Click Edit Profile to add'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-0.5">
                    Authentication Method
                  </span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {profile?.google_id ? 'Google OAuth 2.0 (Verified)' : 'Email & Encrypted Password'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {profile?.created_at ? `Joined ${new Date(profile.created_at).toLocaleDateString()}` : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Stats & Institutional Recognition */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={15} className="text-primary-600" />
              Activity & Engagement
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-primary-50/70 border border-primary-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-primary-900 font-semibold block">
                    {profile?.role === 'faculty' ? 'Events Organized' : 'Events Registered'}
                  </span>
                  <span className="text-2xl font-black text-primary-950">
                    {profile?.role === 'faculty'
                      ? profile?.stats?.createdEvents || 0
                      : profile?.stats?.totalRegistrations || 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-semibold block">Feedback Submitted</span>
                  <span className="text-2xl font-black text-amber-950">
                    {profile?.stats?.totalFeedback || 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                  <MessageSquare size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Badge Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-md mx-auto flex items-center justify-center text-primary-600 mb-3 border border-slate-200">
              <Award size={24} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              {isAffiliated
                ? 'Wolverhampton Partner College'
                : profile?.role === 'faculty'
                ? 'Faculty Event Organizer'
                : 'Campus Event Explorer'}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isAffiliated
                ? 'Your student profile is synchronized with Wolverhampton academic cohorts for event attendance and certificates.'
                : 'Participate in campus hackathons, workshops, and student festivals on Evently.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-primary-600" />
                Edit Profile Details
              </h2>
              <button
                onClick={() => { setEditing(false); setEditError(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nasad Mansuri"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (10 Digits)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {isAffiliated && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                    <select
                      value={academicSemester}
                      onChange={(e) => setAcademicSemester(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Group</label>
                    <select
                      value={academicGroup}
                      onChange={(e) => setAcademicGroup(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditError(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
