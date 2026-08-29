import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, ShieldCheck, Check, X, Loader2, AlertCircle, Users, UserCheck, GraduationCap,
  Trash2, ChevronLeft, ChevronRight, ArrowUpDown, UserX, Ban, ShieldAlert, AlertTriangle,
  Mail, Phone, Calendar, Landmark, BookOpen, Layers, Award, ExternalLink, Eye,
  Ticket, MessageSquare, Sparkles, MapPin, CalendarDays, BarChart3, Clock
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';

const ROLES = ['All', 'student', 'guest', 'faculty', 'admin'];
const ROLE_LABELS = { All: 'All Roles', student: 'Student (Affiliated)', guest: 'Guest (External)', faculty: 'Faculty', admin: 'Admin' };
const ROLE_BADGE = {
  student: 'bg-primary-50 text-primary-700 border border-primary-100',
  faculty: 'bg-violet-50 text-violet-700 border border-violet-100',
  guest: 'bg-amber-50 text-amber-800 border border-amber-200',
  admin: 'bg-purple-50 text-purple-700 border border-purple-100',
};

function getAffiliationSummary(u) {
  if (u.role === 'student') {
    const college = u.sp_college_name || u.college_name || 'Affiliated Campus';
    const tag = u.academic_level && u.academic_group ? `L${u.academic_level} · ${u.academic_group}` : null;
    return tag ? `${college} (${tag})` : college;
  }
  if (u.role === 'faculty') {
    return [u.department, u.designation].filter(Boolean).join(' · ') || u.faculty_id_code || 'Faculty Member';
  }
  if (u.role === 'guest') {
    return [u.gp_college_name || u.college_name || 'External College', u.course_major].filter(Boolean).join(' · ') || 'Guest Participant';
  }
  if (u.role === 'admin') {
    return 'Campus Administration';
  }
  return '—';
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('All');
  const [actioningId, setActioningId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [deactivateModalUser, setDeactivateModalUser] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setUserActivity(null);
      return;
    }
    let isMounted = true;
    setActivityLoading(true);
    api
      .get(`/users/${selectedUser.id}/activity`)
      .then((res) => {
        if (isMounted) setUserActivity(res.data);
      })
      .catch((err) => {
        console.error('Failed to load user activity:', err);
      })
      .finally(() => {
        if (isMounted) setActivityLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedUser]);

  useEffect(() => {
    setPage(1);
  }, [search, activeRole, sortBy]);

  const filtered = useMemo(() => {
    let list = users;
    if (activeRole !== 'All') list = list.filter((u) => u.role === activeRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id) === search.trim()
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      return 0;
    });
    return list;
  }, [users, search, activeRole, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function resetFilters() {
    setSearch('');
    setActiveRole('All');
    setSortBy('newest');
    setPage(1);
  }

  async function handleApproval(id, status) {
    setActioningId(id);
    try {
      await api.patch(`/users/${id}/approval`, { status });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, approval_status: status } : u)));
      showToast[status === 'approved' ? 'success' : 'error'](status === 'approved' ? 'Faculty approved' : 'Faculty rejected');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleToggleStatus(targetUser, isActive, reason = '') {
    setActioningId(targetUser.id);
    setSubmittingStatus(true);
    try {
      await api.patch(`/users/${targetUser.id}/status`, { isActive, reason });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: isActive ? 1 : 0 } : u))
      );
      showToast.success(isActive ? 'User account activated' : 'User account deactivated & notified');
      setDeactivateModalUser(null);
      setDeactivateReason('');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update account status');
    } finally {
      setActioningId(null);
      setSubmittingStatus(false);
    }
  }

  async function handleDelete(id) {
    setActioningId(id);
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast.success('User deleted');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActioningId(null);
      setConfirmId(null);
    }
  }

  const totalUsers = users.length;
  const disabledUsers = users.filter((u) => u.is_active === 0).length;
  const pendingApprovals = users.filter((u) => u.role === 'faculty' && u.approval_status === 'pending').length;
  const activeStudents = users.filter((u) => u.role === 'student' && u.is_active !== 0).length;
  const totalGuests = users.filter((u) => u.role === 'guest').length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">User Management</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Manage student and faculty accounts and pending approvals</p>
        </div>
      </div>

      {/* 1. 4-KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Metric 1: Total Users */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Users</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : totalUsers}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Registered accounts</p>
          </div>
        </div>

        {/* Metric 2: Affiliated Students */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Affiliated Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200/60 shadow-2xs">
              <GraduationCap size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : activeStudents}</p>
            <p className="mt-1 text-xs text-primary-700 font-semibold">BIC student cohort</p>
          </div>
        </div>

        {/* Metric 3: Guest Learners */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Guest Learners</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
              <BookOpen size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : totalGuests}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">External students</p>
          </div>
        </div>

        {/* Metric 4: Pending Approvals */}
        <div className={`skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[120px] ${
          pendingApprovals > 0 ? 'ring-2 ring-primary-600 bg-primary-50/20' : ''
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${pendingApprovals > 0 ? 'text-primary-800' : 'text-slate-500'}`}>
              Pending Approvals
            </p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border shadow-2xs ${
              pendingApprovals > 0 ? 'bg-primary-700 text-white border-primary-800' : 'bg-slate-100 text-slate-500 border-slate-200/80'
            }`}>
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : pendingApprovals}</p>
            <p className={`mt-1 text-xs font-medium ${pendingApprovals > 0 ? 'text-primary-700 font-semibold' : 'text-slate-500'}`}>
              {pendingApprovals > 0 ? `${pendingApprovals} faculty awaiting review` : 'All requests processed'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Filter & Search Toolbar */}
      <div className="skeuo-card rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="skeuo-input w-full rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Role Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="min-w-[150px]">
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="skeuo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="skeuo-input w-full rounded-xl py-2.5 pl-8 pr-3 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            {(search || activeRole !== 'All' || sortBy !== 'newest') && (
              <button
                onClick={resetFilters}
                className="skeuo-btn-secondary rounded-xl px-3.5 py-2.5 text-xs font-bold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadUsers} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      <div className="skeuo-card overflow-hidden rounded-[18px]">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 text-slate-300" size={32} />
            <p className="text-sm font-medium text-slate-700">No users match your filters</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[2fr_1.8fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:grid">
              <span>User</span>
              <span>Role & Affiliation</span>
              <span>Status</span>
              <span>Registered</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {paginated.map((u) => {
                const affiliation = getAffiliationSummary(u);
                const isPending = u.role === 'faculty' && u.approval_status === 'pending';
                const isSelf = u.id === currentUser?.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="grid grid-cols-1 gap-3 px-5 py-3.5 sm:grid-cols-[2fr_1.8fr_1fr_1fr_auto] sm:items-center hover:bg-slate-50/90 cursor-pointer transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ring-2 transition-all ${
                        u.role === 'faculty'
                          ? 'bg-violet-100 text-violet-800 ring-violet-200 group-hover:ring-violet-400'
                          : u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 ring-purple-200 group-hover:ring-purple-400'
                          : u.role === 'guest'
                          ? 'bg-amber-100 text-amber-800 ring-amber-200 group-hover:ring-amber-400'
                          : 'bg-primary-100 text-primary-800 ring-primary-200 group-hover:ring-primary-400'
                      }`}>
                        {u.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors flex items-center gap-1.5">
                          <span className="truncate">{u.full_name}</span>
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 text-primary-600 transition-opacity shrink-0" />
                        </p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-0.5 ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                        {u.role === 'faculty' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-800 bg-violet-50/90 border border-violet-200/80 px-2 py-0.5 rounded-full mb-0.5">
                            <Calendar size={10} className="text-violet-600" />
                            {u.events_created_count || 0} evt{(u.events_created_count || 0) === 1 ? '' : 's'} · {u.total_attendees_hosted || 0} att
                          </span>
                        )}
                        {(u.role === 'student' || u.role === 'guest') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-full mb-0.5">
                            <Ticket size={10} className="text-emerald-600" />
                            {u.registered_events_count || 0} reg{(u.registered_events_count || 0) === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-600 font-medium" title={affiliation}>{affiliation}</p>
                    </div>

                    <div>
                      {u.is_active === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                          <UserX size={11} /> Disabled
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <ShieldCheck size={11} /> Pending
                        </span>
                      ) : u.role === 'faculty' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 capitalize">
                          <Check size={11} /> {u.approval_status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <Check size={11} /> Active
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-500 font-medium">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>

                    <div className="flex items-center justify-start gap-2 sm:justify-end" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleApproval(u.id, 'rejected')}
                            className="skeuo-btn-secondary flex items-center gap-1 rounded-xl !border-rose-200 !bg-rose-50 !text-rose-700 px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            <X size={12} /> Reject
                          </button>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleApproval(u.id, 'approved')}
                            className="skeuo-btn-primary flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {actioningId === u.id ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />} Approve
                          </button>
                        </>
                      ) : isSelf ? (
                        <span className="text-[11px] font-bold text-slate-400">This is you</span>
                      ) : confirmId === u.id ? (
                        <>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleDelete(u.id)}
                            className="skeuo-btn-primary !bg-rose-700 !border-rose-900 rounded-xl px-3 py-1.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                          >
                            {actioningId === u.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="skeuo-btn-secondary rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {u.is_active === 0 ? (
                            <button
                              disabled={actioningId === u.id}
                              onClick={() => handleToggleStatus(u, true)}
                              className="skeuo-btn-secondary flex items-center gap-1 rounded-xl !border-emerald-200 !bg-emerald-50 px-3 py-1.5 text-xs font-bold !text-emerald-700 cursor-pointer disabled:opacity-50"
                            >
                              <UserCheck size={12} /> Enable
                            </button>
                          ) : (
                            <button
                              disabled={actioningId === u.id}
                              onClick={() => setDeactivateModalUser(u)}
                              className="skeuo-btn-secondary flex items-center gap-1 rounded-xl !border-amber-200 !bg-amber-50 px-3 py-1.5 text-xs font-bold !text-amber-800 cursor-pointer disabled:opacity-50"
                            >
                              <Ban size={12} /> Disable
                            </button>
                          )}

                          <button
                            onClick={() => setConfirmId(u.id)}
                            className="skeuo-btn-secondary flex items-center gap-1 rounded-xl !border-rose-200 !bg-rose-50 px-3 py-1.5 text-xs font-bold !text-rose-700 cursor-pointer"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-[11px] text-slate-400">
                  Page {page} of {totalPages} · {filtered.length} user{filtered.length === 1 ? '' : 's'}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rich User Profile Detail Modal */}
      {selectedUser &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header Cover */}
              <div className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 p-6 text-white">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 rounded-full bg-white/10 p-1.5 text-white/80 backdrop-blur-xs transition hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black text-white border-2 border-white/20 shadow-lg">
                    {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE[selectedUser.role] || 'bg-white/20 text-white'}`}>
                        {selectedUser.role}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${selectedUser.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedUser.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {selectedUser.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white truncate">{selectedUser.full_name}</h2>
                    <p className="text-xs text-primary-200/90 truncate">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body Info Cards */}
              <div className="max-h-[65vh] overflow-y-auto overscroll-contain p-6 space-y-4 text-xs">
                {/* Deactivation Banner if disabled */}
                {!selectedUser.is_active && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-rose-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <Ban size={14} className="text-rose-600" /> Account Currently Deactivated
                    </div>
                    {selectedUser.deactivation_reason ? (
                      <p className="text-[11.5px] text-rose-800 leading-relaxed font-medium pl-5">
                        <strong>Reason:</strong> {selectedUser.deactivation_reason}
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-700/80 italic pl-5">No explicit reason was documented during deactivation.</p>
                    )}
                  </div>
                )}

                {/* 1. Activity & Engagement KPI Strip */}
                {selectedUser.role === 'faculty' ? (
                  <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 via-white to-slate-50 p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <BarChart3 size={15} className="text-violet-700" /> Faculty Event Portfolio & Impact
                      </h4>
                      <span className="text-[10px] font-bold text-violet-800 bg-violet-100/80 px-2 py-0.5 rounded-full">
                        Organizer Metrics
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-violet-600 mb-1">
                          <Calendar size={15} />
                        </div>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {selectedUser.events_created_count || 0}
                        </span>
                        <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                          Events Created
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-indigo-600 mb-1">
                          <Users size={15} />
                        </div>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {selectedUser.total_attendees_hosted || 0}
                        </span>
                        <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                          Total Attendees
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-emerald-600 mb-1">
                          <Sparkles size={15} />
                        </div>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {selectedUser.active_events_count || 0}
                        </span>
                        <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                          Active / Live
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-amber-600 mb-1">
                          <MessageSquare size={15} />
                        </div>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {selectedUser.feedback_responses_received || 0}
                        </span>
                        <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">
                          Feedback Score
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (selectedUser.role === 'student' || selectedUser.role === 'guest') ? (
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Ticket size={15} className="text-emerald-700" /> Student Event Participation
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {selectedUser.is_guest ? 'Guest Learner' : 'Affiliated Student'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-emerald-600 mb-1">
                          <CalendarDays size={16} />
                        </div>
                        <span className="text-lg font-black text-slate-900 block leading-tight">
                          {selectedUser.registered_events_count || 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Registered Events
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs">
                        <div className="flex items-center justify-center text-amber-600 mb-1">
                          <MessageSquare size={16} />
                        </div>
                        <span className="text-lg font-black text-slate-900 block leading-tight">
                          {selectedUser.feedback_submitted_count || 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Surveys Completed
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. Recent Events / Registrations Timeline */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Clock size={14} className="text-primary-600" />
                      {selectedUser.role === 'faculty' ? 'Recent Campus Events Created' : 'Recent Event Registrations'}
                    </h4>
                    {activityLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
                  </div>

                  {selectedUser.role === 'faculty' ? (
                    activityLoading ? (
                      <div className="space-y-2 py-1">
                        <div className="h-12 bg-slate-200/60 animate-pulse rounded-xl" />
                        <div className="h-12 bg-slate-200/60 animate-pulse rounded-xl" />
                      </div>
                    ) : userActivity?.hostedEvents?.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {userActivity.hostedEvents.map((evt) => (
                          <div key={evt.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-primary-200 transition">
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {evt.category}
                                </span>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${evt.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                  {evt.status}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs truncate">{evt.title}</h5>
                              <div className="flex items-center gap-3 text-[10.5px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {evt.event_date ? new Date(evt.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users size={11} className="text-primary-600" />
                                  {evt.registered_count} {evt.max_participants ? `/ ${evt.max_participants}` : ''} registered
                                </span>
                              </div>
                            </div>
                            <a
                              href={`/events/${evt.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-primary-50 transition"
                              title="View Event Page"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        <Calendar size={22} className="mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No events published yet by this faculty member.</p>
                      </div>
                    )
                  ) : (
                    activityLoading ? (
                      <div className="space-y-2 py-1">
                        <div className="h-12 bg-slate-200/60 animate-pulse rounded-xl" />
                        <div className="h-12 bg-slate-200/60 animate-pulse rounded-xl" />
                      </div>
                    ) : userActivity?.registeredEvents?.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {userActivity.registeredEvents.map((reg) => (
                          <div key={reg.registration_id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition">
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {reg.category}
                                </span>
                                <span className="text-[9.5px] font-semibold text-slate-400">
                                  {reg.registered_at ? `Reg ${new Date(reg.registered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-900 text-xs truncate">{reg.title}</h5>
                              <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {reg.event_date ? new Date(reg.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                </span>
                                {reg.location && (
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin size={11} /> {reg.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <a
                              href={`/events/${reg.event_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                              title="View Event Details"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        <Ticket size={22} className="mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No event registrations found for this user.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Academic / Affiliation Credentials */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Landmark size={14} className="text-primary-600" /> Academic & Institutional Affiliation
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block">Institution / College</span>
                      <span className="font-bold text-slate-900">
                        {selectedUser.role === 'faculty' || selectedUser.role === 'admin'
                          ? 'Biratnagar International College'
                          : (selectedUser.college_name || selectedUser.sp_college_name || selectedUser.gp_college_name || 'Biratnagar International College')}
                      </span>
                    </div>
                    {selectedUser.role === 'student' && (
                      <>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Faculty</span>
                          <span className="font-bold text-slate-900">{selectedUser.faculty_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Course / Degree</span>
                          <span className="font-bold text-slate-900">{selectedUser.course_name || selectedUser.course_major || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Cohort Level & Group</span>
                          <span className="font-bold text-slate-900">
                            {selectedUser.academic_level ? `Level ${selectedUser.academic_level}` : '—'}
                            {selectedUser.academic_semester ? ` · Sem ${selectedUser.academic_semester}` : ''}
                            {selectedUser.academic_group ? ` (G${selectedUser.academic_group})` : ''}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'guest' && (
                      <>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Course / Major</span>
                          <span className="font-bold text-slate-900">{selectedUser.course_major || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Participation Type</span>
                          <span className="font-bold text-slate-900">External Guest Learner</span>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'faculty' && (
                      <>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Faculty Code</span>
                          <span className="font-mono font-bold text-slate-900">{selectedUser.faculty_id_code || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Department</span>
                          <span className="font-bold text-slate-900">{selectedUser.department || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 block">Designation</span>
                          <span className="font-bold text-slate-900">{selectedUser.designation || '—'}</span>
                        </div>
                        {selectedUser.community && (
                          <div>
                            <span className="text-[10.5px] font-semibold text-slate-400 block">Community</span>
                            <span className="font-bold text-slate-900">{selectedUser.community}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Contact & Registration Meta */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Mail size={14} className="text-primary-600" /> Contact & Registration
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block">Email Address</span>
                      <span className="font-medium text-slate-900 truncate block">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block">Phone Number</span>
                      <span className="font-medium text-slate-900">{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block">Registered On</span>
                      <span className="font-medium text-slate-900">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block">System User ID</span>
                      <span className="font-mono text-slate-600">#{selectedUser.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close
                </button>

                {selectedUser.id !== currentUser?.id && (
                  <div className="flex items-center gap-2">
                    {selectedUser.is_active ? (
                      <button
                        type="button"
                        disabled={actioningId === selectedUser.id}
                        onClick={() => {
                          const target = selectedUser;
                          setSelectedUser(null);
                          setDeactivateModalUser(target);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-95 transition disabled:opacity-50"
                      >
                        <Ban size={13} /> Disable Account
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actioningId === selectedUser.id}
                        onClick={() => handleToggleStatus(selectedUser, true)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                      >
                        <Check size={13} /> Enable Account
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actioningId === selectedUser.id}
                      onClick={() => handleDelete(selectedUser.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95 transition disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Account Deactivation Modal */}
      {deactivateModalUser &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deactivate Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deactivating <strong className="text-slate-700">{deactivateModalUser.full_name}</strong> will block login and display the reason on their login screen.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Deactivation <span className="text-slate-400 font-normal">(Displayed on user's login page & access attempts)</span>
                </label>
                <textarea
                  rows={3}
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="e.g., Account suspended due to policy review, alumni record, or guideline violation."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setDeactivateModalUser(null); setDeactivateReason(''); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingStatus}
                  onClick={() => handleToggleStatus(deactivateModalUser, false, deactivateReason)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                >
                  {submittingStatus ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}