'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  FileText,
  CheckSquare,
  ShieldAlert,
  Search,
  Trash2,
  Lock,
  Globe,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  Shield,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type TabType = 'overview' | 'users' | 'exams' | 'submissions';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);

  // Overview Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalSubmissions: 0,
    violationCount: 0,
  });
  const [recentData, setRecentData] = useState<{
    users: any[];
    exams: any[];
    submissions: any[];
  }>({ users: [], exams: [], submissions: [] });

  // Users Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Exams Management State
  const [examsList, setExamsList] = useState<any[]>([]);
  const [examSearch, setExamSearch] = useState('');
  const [examVisibilityFilter, setExamVisibilityFilter] = useState('');

  // Submissions Management State
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [violationsOnly, setViolationsOnly] = useState(false);

  // Message / Alert feedback
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load Overview Data
  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentData(data.recent);
      } else {
        showToast(data.error || 'Lỗi tải thống kê', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Users Data
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('q', userSearch);
      if (userRoleFilter) params.set('role', userRoleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch {
      showToast('Lỗi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Exams Data
  const loadExams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (examSearch) params.set('q', examSearch);
      if (examVisibilityFilter) params.set('visibility', examVisibilityFilter);

      const res = await fetch(`/api/admin/exams?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExamsList(data.exams);
      }
    } catch {
      showToast('Lỗi tải danh sách đề thi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Submissions Data
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (submissionSearch) params.set('q', submissionSearch);
      if (violationsOnly) params.set('violations', 'true');

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubmissionsList(data.submissions);
      }
    } catch {
      showToast('Lỗi tải danh sách bài làm', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Switch tabs
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    if (activeTab === 'overview') loadStats();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'exams') loadExams();
    else if (activeTab === 'submissions') loadSubmissions();
  }, [activeTab, user]);

  // User Actions: Update Role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã cập nhật vai trò sang ${newRole}`);
        loadUsers();
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // User Actions: Delete User
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"? Thao tác này không thể hoàn tác!`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa người dùng thành công');
        loadUsers();
      } else {
        showToast(data.error || 'Xóa thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Exam Actions: Toggle Public/Private
  const handleToggleVisibility = async (examId: string, currentPublic: boolean) => {
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, isPublic: !currentPublic }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã đổi trạng thái sang ${!currentPublic ? 'Công khai' : 'Riêng tư'}`);
        loadExams();
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Exam Actions: Delete Exam
  const handleDeleteExam = async (examId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${title}"? Mọi bài nộp của đề thi này cũng sẽ bị xóa!`)) return;
    try {
      const res = await fetch(`/api/admin/exams?examId=${examId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa đề thi thành công');
        loadExams();
      } else {
        showToast(data.error || 'Xóa đề thi thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Submission Actions: Delete Submission
  const handleDeleteSubmission = async (subId: string, studentName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài làm của "${studentName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/submissions?id=${subId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Đã xóa bài làm thành công');
        loadSubmissions();
      } else {
        showToast(data.error || 'Xóa bài làm thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-600">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Không có quyền truy cập</h2>
          <p className="text-xs text-gray-500 mb-6">
            Khu vực này chỉ dành riêng cho Quản trị viên (ADMIN). Vui lòng đăng nhập với tài khoản có thẩm quyền.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            Quay về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Navbar />

      {/* Admin Top Header Banner */}
      <div className="border-b border-gray-200 bg-white/95 px-4 sm:px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900">
                  Trung tâm Quản trị Hệ thống
                </h1>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700 border border-purple-200">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý toàn diện người dùng, đề thi, lượt làm bài và theo dõi vi phạm thi cử
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'overview') loadStats();
              else if (activeTab === 'users') loadUsers();
              else if (activeTab === 'exams') loadExams();
              else if (activeTab === 'submissions') loadSubmissions();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-600' : 'text-gray-500'}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {feedback.text}
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-6">
        {/* Navigation Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Tổng quan hệ thống</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Người dùng ({stats.totalUsers})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Đề thi ({stats.totalExams})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Bài nộp ({stats.totalSubmissions})</span>
            {stats.violationCount > 0 && (
              <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px]">
                {stats.violationCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Người dùng</span>
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 text-3xl font-black text-gray-900">{stats.totalUsers}</div>
                <div className="mt-1 text-[11px] text-gray-500">Giáo viên & Học sinh đã đăng ký</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Đề thi</span>
                  <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 text-3xl font-black text-gray-900">{stats.totalExams}</div>
                <div className="mt-1 text-[11px] text-gray-500">Chuẩn GDPT 2018 trên hệ thống</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Lượt làm bài</span>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 text-3xl font-black text-gray-900">{stats.totalSubmissions}</div>
                <div className="mt-1 text-[11px] text-gray-500">Bài thi được chấm tự động</div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 uppercase">Cảnh báo vi phạm</span>
                  <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 text-3xl font-black text-rose-700">{stats.violationCount}</div>
                <div className="mt-1 text-[11px] text-rose-600">Bài làm có rời màn hình / gian lận</div>
              </div>
            </div>

            {/* Recent Activities Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Users */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Người dùng mới nhất</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentData.users.map(u => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{u.fullName}</div>
                        <div className="text-[11px] text-gray-400">{u.phone}</div>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                  {recentData.users.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Chưa có người dùng nào</div>
                  )}
                </div>
              </div>

              {/* Recent Exams */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Đề thi mới tạo</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('exams')}
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentData.exams.map(e => (
                    <div key={e.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-gray-800 truncate">{e.title}</div>
                        <div className="text-[11px] text-gray-400">
                          {e.totalQuestions} câu • {e.author?.fullName || 'Ẩn danh'}
                        </div>
                      </div>
                      <Link
                        href={`/exam/${e.id}`}
                        target="_blank"
                        className="rounded-lg bg-gray-50 p-1.5 text-gray-400 hover:text-indigo-600 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                  {recentData.exams.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Chưa có đề thi nào</div>
                  )}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                    <span>Bài thi vừa nộp</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentData.submissions.map(s => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-gray-800 truncate">{s.studentName}</div>
                        <div className="text-[11px] text-gray-400 truncate">{s.exam?.title}</div>
                      </div>
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                        {s.score.toFixed(1)} đ
                      </span>
                    </div>
                  ))}
                  {recentData.submissions.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Chưa có lượt nộp bài nào</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers()}
                  placeholder="Tìm theo họ tên, số điện thoại hoặc email..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="USER">Người dùng (USER)</option>
                </select>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
                >
                  Lọc
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Đề thi / Bài thi</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3 font-bold text-gray-900">{u.fullName}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{u.phone}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {u._count?.exams || 0} đề • {u._count?.submissions || 0} bài nộp
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role === 'USER' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateRole(u.id, 'ADMIN')}
                              title="Thăng cấp thành Admin"
                              className="rounded-lg bg-purple-50 border border-purple-200 p-1.5 text-purple-700 hover:bg-purple-100 transition"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={u.id === user.id}
                              onClick={() => handleUpdateRole(u.id, 'USER')}
                              title="Hạ cấp xuống User"
                              className="rounded-lg bg-amber-50 border border-amber-200 p-1.5 text-amber-700 hover:bg-amber-100 transition disabled:opacity-40"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={u.id === user.id}
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            title="Xóa người dùng này"
                            className="rounded-lg bg-rose-50 border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-100 transition disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">
                        Không tìm thấy người dùng nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXAMS MANAGEMENT */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={examSearch}
                  onChange={e => setExamSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadExams()}
                  placeholder="Tìm theo tiêu đề đề thi hoặc tên giáo viên tạo..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={examVisibilityFilter}
                  onChange={e => setExamVisibilityFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="public">Công khai (Public)</option>
                  <option value="private">Riêng tư (Private)</option>
                </select>

                <button
                  type="button"
                  onClick={loadExams}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
                >
                  Lọc
                </button>
              </div>
            </div>

            {/* Exams Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ID / Tiêu đề đề thi</th>
                    <th className="px-4 py-3">Người tạo</th>
                    <th className="px-4 py-3">Thời gian & Số câu</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Bài nộp</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examsList.map(e => (
                    <tr key={e.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-gray-900 truncate" title={e.title}>{e.title}</div>
                        <div className="font-mono text-[11px] text-gray-400">ID: {e.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{e.author?.fullName || 'Ẩn danh'}</div>
                        <div className="text-[11px] text-gray-400">{e.author?.phone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {e.totalQuestions} câu • {e.durationMinutes} phút
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(e.id, e.isPublic)}
                          title="Bấm để chuyển trạng thái"
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-bold border transition cursor-pointer ${
                            e.isPublic
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {e.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          <span>{e.isPublic ? 'Công khai' : 'Riêng tư'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-indigo-600">
                        {e._count?.submissions || 0} lượt
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/exam/${e.id}`}
                            target="_blank"
                            title="Vào xem phòng thi"
                            className="rounded-lg bg-gray-50 border border-gray-200 p-1.5 text-gray-600 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteExam(e.id, e.title)}
                            title="Xóa đề thi này"
                            className="rounded-lg bg-rose-50 border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {examsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">
                        Không tìm thấy đề thi nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS MANAGEMENT */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={submissionSearch}
                  onChange={e => setSubmissionSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadSubmissions()}
                  placeholder="Tìm theo tên học sinh, số điện thoại hoặc tên đề..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViolationsOnly(!violationsOnly)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    violationsOnly
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Chỉ bài có vi phạm ({stats.violationCount})</span>
                </button>

                <button
                  type="button"
                  onClick={loadSubmissions}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
                >
                  Lọc
                </button>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Thí sinh</th>
                    <th className="px-4 py-3">Đề thi</th>
                    <th className="px-4 py-3">Điểm số</th>
                    <th className="px-4 py-3">Giám sát vi phạm</th>
                    <th className="px-4 py-3">Thời gian nộp</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissionsList.map(s => (
                    <tr key={s.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{s.studentName}</div>
                        <div className="text-[11px] text-gray-400">{s.studentPhone || 'Tự do'}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-gray-800 truncate" title={s.examTitle}>{s.examTitle}</div>
                        <div className="font-mono text-[10px] text-gray-400">Mã đề: {s.examId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-black text-emerald-800">
                          {s.score.toFixed(1)} / {s.totalScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.hasViolation ? (
                          <div className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <ShieldAlert className="h-3 w-3" />
                            <span>{s.proctoringReport.outScreenCount || 0} lần rời màn hình</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Shield className="h-3 w-3" />
                            <span>Bình thường</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(s.submittedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/exam/${s.examId}/result/${s.id}`}
                            target="_blank"
                            title="Xem chi tiết kết quả bài nộp"
                            className="rounded-lg bg-gray-50 border border-gray-200 p-1.5 text-gray-600 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubmission(s.id, s.studentName)}
                            title="Xóa bài nộp này"
                            className="rounded-lg bg-rose-50 border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {submissionsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">
                        Không tìm thấy bài làm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
