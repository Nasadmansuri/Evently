import { useEffect, useState, useMemo } from 'react';
import { Search, ShieldCheck, Check, X, Loader2, AlertCircle, Users, UserCheck, GraduationCap, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
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

function roleDetails(u) {
  if (u.role === 'student') {
    const parts = [u.sp_college_name || u.college_name, u.faculty_name, u.course_name].filter(Boolean);
    const academic = [u.academic_level && `Level ${u.academic_level}`, u.academic_semester && `Sem ${u.academic_semester}`, u.academic_group]
      .filter(Boolean)
      .join(' · ');
    return [parts.join(' · '), academic].filter(Boolean);
  }
  if (u.role === 'faculty') {
    const line1 = [u.faculty_id_code, u.department, u.designation].filter(Boolean).join(' · ');
    const line2 = u.community && u.community !== 'N/A' ? u.community : null;
    return [line1, line2].filter(Boolean);
  }
  if (u.role === 'guest') {
    return [[u.gp_college_name || u.college_name || 'External College', u.course_major || 'General Participant'].filter(Boolean).join(' · ')].filter(Boolean);
  }
  return [];
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
  const pendingApprovals = users.filter((u) => u.role === 'faculty' && u.approval_status === 'pending').length;
  const activeStudents = users.filter((u) => u.role === 'student').length;
  const totalGuests = users.filter((u) => u.role === 'guest').length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">User Management</h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Manage all users and approve faculty registrations</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <Users className="text-primary-600" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : totalUsers}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <GraduationCap className="text-emerald-600" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Affiliated Students</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : activeStudents}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Users className="text-amber-600" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Guest Students</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : totalGuests}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50">
            <ShieldCheck className="text-violet-600" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Approvals</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : pendingApprovals}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Filter by Role</label>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sort By</label>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadUsers} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
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
            <div className="hidden grid-cols-[2fr_2fr_1fr_1fr] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:grid">
              <span>User</span>
              <span>Role & Details</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {paginated.map((u) => {
                const details = roleDetails(u);
                const isPending = u.role === 'faculty' && u.approval_status === 'pending';
                const isSelf = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[2fr_2fr_1fr_1fr] sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {u.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{u.full_name}</p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    <div>
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                      {details.map((line, i) => (
                        <p key={i} className="text-[11px] text-slate-500">{line}</p>
                      ))}
                    </div>

                    <div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <ShieldCheck size={11} /> Pending
                        </span>
                      ) : u.role === 'faculty' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 capitalize">
                          {u.approval_status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-start gap-2 sm:justify-end">
                      {isPending ? (
                        <>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleApproval(u.id, 'rejected')}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <X size={12} /> Reject
                          </button>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleApproval(u.id, 'approved')}
                            className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                          >
                            {actioningId === u.id ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />} Approve
                          </button>
                        </>
                      ) : isSelf ? (
                        <span className="text-[11px] text-slate-400">This is you</span>
                      ) : confirmId === u.id ? (
                        <>
                          <button
                            disabled={actioningId === u.id}
                            onClick={() => handleDelete(u.id)}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            {actioningId === u.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmId(u.id)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
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

    </div>
  );
}