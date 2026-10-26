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
  UserPlus,
  KeyRound,
  Edit3,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  Shield,
  Award,
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  Server,
  Activity,
  CheckCircle2,
  X,
  ListOrdered,
  AlertTriangle,
  HardDrive
} from 'lucide-react';

type TabType = 'overview' | 'users' | 'exams' | 'submissions' | 'system';

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

  // System & Health State
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // Modals state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ fullName: '', phone: '', email: '', password: '', role: 'USER' });

  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [targetUserForPass, setTargetUserForPass] = useState<any>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [targetUserForEdit, setTargetUserForEdit] = useState<any>(null);

  const [examDetailModalOpen, setExamDetailModalOpen] = useState(false);
  const [selectedExamDetail, setSelectedExamDetail] = useState<any>(null);
  const [loadingExamDetail, setLoadingExamDetail] = useState(false);

  const [subDetailModalOpen, setSubDetailModalOpen] = useState(false);
  const [selectedSubDetail, setSelectedSubDetail] = useState<any>(null);
  const [loadingSubDetail, setLoadingSubDetail] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
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

  // Load System Info
  const loadSystemInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      if (data.success) {
        setSystemInfo(data);
      }
    } catch {
      showToast('Lỗi tải thông tin hệ thống', 'error');
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
    else if (activeTab === 'system') loadSystemInfo();
  }, [activeTab, user]);

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã tạo thành công tài khoản "${data.user.fullName}"`);
        setAddUserModalOpen(false);
        setNewUserData({ fullName: '', phone: '', email: '', password: '', role: 'USER' });
        loadUsers();
      } else {
        showToast(data.error || 'Tạo người dùng thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPass || !newPasswordInput) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserForPass.id, newPassword: newPasswordInput }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã đặt lại mật khẩu cho "${targetUserForPass.fullName}"`);
        setResetPassModalOpen(false);
        setNewPasswordInput('');
        setTargetUserForPass(null);
      } else {
        showToast(data.error || 'Đặt lại mật khẩu thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Edit User Handler
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForEdit) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserForEdit.id,
          fullName: targetUserForEdit.fullName,
          phone: targetUserForEdit.phone,
          email: targetUserForEdit.email,
          role: targetUserForEdit.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cập nhật thông tin người dùng thành công');
        setEditUserModalOpen(false);
        setTargetUserForEdit(null);
        loadUsers();
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

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
        showToast(`Đã chuyển vai trò sang ${newRole}`);
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

  // Exam Actions: View Detail
  const handleOpenExamDetail = async (examId: string) => {
    setLoadingExamDetail(true);
    setExamDetailModalOpen(true);
    try {
      const res = await fetch(`/api/admin/exams?id=${examId}`);
      const data = await res.json();
      if (data.success && data.exam) {
        setSelectedExamDetail(data.exam);
      } else {
        showToast('Không thể tải chi tiết đề thi', 'error');
        setExamDetailModalOpen(false);
      }
    } catch {
      showToast('Lỗi kết nối khi tải đề thi', 'error');
      setExamDetailModalOpen(false);
    } finally {
      setLoadingExamDetail(false);
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

  // Submission Actions: View Detail
  const handleOpenSubDetail = async (subId: string) => {
    setLoadingSubDetail(true);
    setSubDetailModalOpen(true);
    try {
      const res = await fetch(`/api/admin/submissions?id=${subId}`);
      const data = await res.json();
      if (data.success && data.submission) {
        setSelectedSubDetail(data);
      } else {
        showToast('Không thể tải chi tiết bài làm', 'error');
        setSubDetailModalOpen(false);
      }
    } catch {
      showToast('Lỗi kết nối khi tải bài làm', 'error');
      setSubDetailModalOpen(false);
    } finally {
      setLoadingSubDetail(false);
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

  // Export Exams to CSV (UTF-8 BOM)
  const handleExportExamsCSV = () => {
    if (examsList.length === 0) {
      showToast('Không có đề thi nào để xuất', 'error');
      return;
    }
    const headers = ['Mã đề thi', 'Tiêu đề đề thi', 'Tác giả', 'Số điện thoại', 'Số câu hỏi', 'Thời gian (phút)', 'Trạng thái', 'Số lượt nộp', 'Ngày tạo'];
    const rows = examsList.map(e => [
      `"${e.id}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.author?.fullName || 'Ẩn danh').replace(/"/g, '""')}"`,
      `"${e.author?.phone || ''}"`,
      e.totalQuestions,
      e.durationMinutes,
      e.isPublic ? 'Công khai' : 'Riêng tư',
      e._count?.submissions || 0,
      `"${new Date(e.createdAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_De_Thi_Admin_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách đề thi ra file Excel (CSV)');
  };

  // Export Submissions to CSV (UTF-8 BOM)
  const handleExportSubmissionsCSV = () => {
    if (submissionsList.length === 0) {
      showToast('Không có bài nộp nào để xuất', 'error');
      return;
    }
    const headers = ['Mã bài thi', 'Tên học sinh', 'Số điện thoại', 'Tên đề thi', 'Điểm số', 'Thang điểm', 'Rời màn hình (lần)', 'Thoát Fullscreen (lần)', 'Có vi phạm', 'Thời gian nộp'];
    const rows = submissionsList.map(s => [
      `"${s.id}"`,
      `"${(s.studentName || '').replace(/"/g, '""')}"`,
      `"${s.studentPhone || ''}"`,
      `"${(s.examTitle || '').replace(/"/g, '""')}"`,
      s.score,
      s.totalScore,
      s.proctoringReport?.outScreenCount || 0,
      s.proctoringReport?.fullscreenExitCount || 0,
      s.hasViolation ? 'CÓ VI PHẠM' : 'Bình thường',
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Diem_Toan_He_Thong_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất bảng điểm toàn hệ thống ra file Excel (CSV)');
  };

  // Export Complete System Backup (JSON)
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/system', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `N5Exam_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Đã tải xuống bản sao lưu toàn bộ hệ thống (JSON)');
      } else {
        showToast('Sao lưu thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi sao lưu', 'error');
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
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'overview') loadStats();
                else if (activeTab === 'users') loadUsers();
                else if (activeTab === 'exams') loadExams();
                else if (activeTab === 'submissions') loadSubmissions();
                else if (activeTab === 'system') loadSystemInfo();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-600' : 'text-gray-500'}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4">
          <div className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xl ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {feedback.text}
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-6">
        {/* Navigation Tabs (5 Tabs) */}
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

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Hệ thống & Sao lưu</span>
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
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                      <button
                        onClick={() => handleOpenExamDetail(e.id)}
                        className="rounded-lg bg-gray-50 p-1.5 text-gray-400 hover:text-indigo-600 transition cursor-pointer"
                        title="Xem chi tiết đề thi"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
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
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentData.submissions.map(s => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{s.studentName}</div>
                        <div className="text-[11px] text-gray-400">
                          {s.score} / {s.totalScore} đ • {new Date(s.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenSubDetail(s.id)}
                        className="rounded-lg bg-gray-50 p-1.5 text-gray-400 hover:text-emerald-600 transition cursor-pointer"
                        title="Xem chi tiết bài nộp"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {recentData.submissions.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Chưa có bài làm nào</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Danh sách người dùng hệ thống</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quản lý tài khoản, thêm người dùng mới, đặt lại mật khẩu và phân quyền
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddUserModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-purple-200 transition cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ Thêm người dùng mới</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên, Số điện thoại hoặc Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setTimeout(loadUsers, 50);
                }}
                className="w-full sm:w-48 py-2 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Tất cả vai trò</option>
                <option value="USER">Người dùng (Giáo viên / Học sinh)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>

              <button
                onClick={loadUsers}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Ngày tham gia</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-xs uppercase">
                            {u.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">{u.fullName}</span>
                            {u.id === 'admin-master-root' && (
                              <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Master</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono">{u.phone}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {u.role === 'ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setTargetUserForPass(u);
                              setNewPasswordInput('');
                              setResetPassModalOpen(true);
                            }}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          {/* Edit User Info */}
                          <button
                            onClick={() => {
                              setTargetUserForEdit({ ...u });
                              setEditUserModalOpen(true);
                            }}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Toggle Admin Role */}
                          {u.id !== 'admin-master-root' && u.id !== user?.id && (
                            <button
                              onClick={() => handleUpdateRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                              title={u.role === 'ADMIN' ? 'Hạ quyền thành User' : 'Nâng cấp quyền Admin'}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                u.role === 'ADMIN'
                                  ? 'text-purple-600 hover:bg-purple-50'
                                  : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                              }`}
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete User */}
                          {u.id !== 'admin-master-root' && u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              title="Xóa tài khoản"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Danh sách đề thi toàn hệ thống</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kiểm tra nội dung câu hỏi, đáp án, cấu hình chống gian lận và xuất báo cáo
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExamsCSV}
                  className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Xuất danh sách (CSV)</span>
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Tiêu đề, Mã đề thi hoặc Tên giáo viên..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadExams()}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <select
                value={examVisibilityFilter}
                onChange={(e) => {
                  setExamVisibilityFilter(e.target.value);
                  setTimeout(loadExams, 50);
                }}
                className="w-full sm:w-44 py-2 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
              </select>

              <button
                onClick={loadExams}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Exams Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Tiêu đề đề thi</th>
                    <th className="px-4 py-3">Tác giả</th>
                    <th className="px-4 py-3">Cấu hình</th>
                    <th className="px-4 py-3">Lượt nộp</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {examsList.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 max-w-xs truncate">{e.title}</div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">{e.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800 font-semibold">{e.author?.fullName || 'Ẩn danh'}</div>
                        <div className="text-[11px] text-gray-400">{e.author?.phone || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span>{e.totalQuestions} câu</span> • <span>{e.durationMinutes}p</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/teacher/submissions/${e.id}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{e._count?.submissions || 0} bài</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleVisibility(e.id, e.isPublic)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            e.isPublic
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {e.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{e.isPublic ? 'Công khai' : 'Riêng tư'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            onClick={() => handleOpenExamDetail(e.id)}
                            title="Xem chi tiết đề thi & Đáp án"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Open Exam Room */}
                          <Link
                            href={`/exam/${e.id}`}
                            target="_blank"
                            title="Mở phòng thi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          {/* Delete Exam */}
                          <button
                            onClick={() => handleDeleteExam(e.id, e.title)}
                            title="Xóa đề thi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {examsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                  <span>Danh sách bài nộp & Giám sát thi cử</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi kết quả điểm số, thời gian làm bài và phát hiện các hành vi gian lận rời màn hình
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSubmissionsCSV}
                  className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Xuất bảng điểm (CSV)</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Tên thí sinh, Số điện thoại hoặc Tên đề thi..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSubmissions()}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-rose-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={violationsOnly}
                  onChange={(e) => {
                    setViolationsOnly(e.target.checked);
                    setTimeout(loadSubmissions, 50);
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Chỉ hiện bài có vi phạm</span>
              </label>

              <button
                onClick={loadSubmissions}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Thí sinh</th>
                    <th className="px-4 py-3">Tên đề thi</th>
                    <th className="px-4 py-3">Điểm số</th>
                    <th className="px-4 py-3">Giám sát vi phạm</th>
                    <th className="px-4 py-3">Thời gian nộp</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {submissionsList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{s.studentName}</div>
                        <div className="text-[11px] font-mono text-gray-400">{s.studentPhone || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800 font-medium max-w-xs truncate">{s.examTitle}</div>
                        <div className="text-[10px] font-mono text-gray-400">{s.examId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-full text-xs ${
                          s.score >= 8
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.score >= 5
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.score} / {s.totalScore} đ
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.hasViolation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Rời màn hình {s.proctoringReport?.outScreenCount} lần
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hợp lệ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail Modal */}
                          <button
                            onClick={() => handleOpenSubDetail(s.id)}
                            title="Xem chi tiết bài làm & Nhật ký giám sát"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Student Result Page */}
                          <Link
                            href={`/exam/${s.examId}/result/${s.id}`}
                            target="_blank"
                            title="Xem trang kết quả thí sinh"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          {/* Delete Submission */}
                          <button
                            onClick={() => handleDeleteSubmission(s.id, s.studentName)}
                            title="Xóa bài nộp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {submissionsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        Không tìm thấy bài làm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM & MAINTENANCE */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Database Health Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Cơ sở dữ liệu</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Server className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {systemInfo?.system?.databaseType || 'Đang kết nối...'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Trạng thái: Hoạt động bình thường</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  Đồng bộ tự động qua Prisma ORM & db-sync
                </div>
              </div>

              {/* Server Runtime Info Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Môi trường máy chủ</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Next.js 14 • {systemInfo?.system?.nodeVersion || 'Node.js'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Uptime: {systemInfo?.system?.uptimeSeconds || 0} giây</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  Bộ nhớ Heap: ~{systemInfo?.system?.memoryUsageMB || 0} MB
                </div>
              </div>

              {/* Zero-Data-Leak Protection Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Bảo mật đề thi</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-700">
                    Zero-Data-Leak (Bật)
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Chặn F12/DevTools lộ đáp án</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  100% bóc tách đáp án phía Backend
                </div>
              </div>
            </div>

            {/* Platform Backup & Maintenance Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <span>Sao lưu & Công cụ Bảo trì Hệ thống</span>
              </h3>
              <p className="text-xs text-gray-500">
                Xuất bản sao lưu toàn bộ dữ liệu (Người dùng, Đề thi, Bài nộp) dưới dạng định dạng chuẩn JSON để lưu trữ ngoại tuyến hoặc khôi phục.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải xuống bản sao lưu toàn bộ hệ thống (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================== */}
      {/* MODAL 1: ADD USER MODAL */}
      {/* ========================================================== */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Thêm tài khoản người dùng mới
              </h3>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thầy Trần Quang Huy"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số điện thoại đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Địa chỉ Email (tùy chọn)
                </label>
                <input
                  type="email"
                  placeholder="giaovien@truong.edu.vn"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mật khẩu ban đầu
                </label>
                <input
                  type="text"
                  placeholder="Mặc định nếu trống: N5Exam123@"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vai trò phân quyền
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                >
                  <option value="USER">Người dùng (Giáo viên / Học sinh)</option>
                  <option value="ADMIN">Quản trị viên (Admin Master)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 transition"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: RESET PASSWORD MODAL */}
      {/* ========================================================== */}
      {resetPassModalOpen && targetUserForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Đặt lại mật khẩu
              </h3>
              <button
                onClick={() => setResetPassModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="font-bold text-gray-900">{targetUserForPass.fullName}</div>
                <div className="text-gray-500 font-mono mt-0.5">{targetUserForPass.phone}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tối thiểu 6 ký tự..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetPassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition"
                >
                  Xác nhận đặt lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: EDIT USER MODAL */}
      {/* ========================================================== */}
      {editUserModalOpen && targetUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Chỉnh sửa thông tin tài khoản
              </h3>
              <button
                onClick={() => setEditUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetUserForEdit.fullName}
                  onChange={(e) => setTargetUserForEdit({ ...targetUserForEdit, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số điện thoại đăng nhập
                </label>
                <input
                  type="text"
                  required
                  value={targetUserForEdit.phone}
                  onChange={(e) => setTargetUserForEdit({ ...targetUserForEdit, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={targetUserForEdit.email || ''}
                  onChange={(e) => setTargetUserForEdit({ ...targetUserForEdit, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  value={targetUserForEdit.role}
                  onChange={(e) => setTargetUserForEdit({ ...targetUserForEdit, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                >
                  <option value="USER">USER (Giáo viên / Học sinh)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 4: EXAM DETAIL MODAL */}
      {/* ========================================================== */}
      {examDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Chi tiết đề thi & Đáp án chuẩn (Admin View)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mã đề: <code className="font-mono text-indigo-600">{selectedExamDetail?.id}</code>
                </p>
              </div>
              <button
                onClick={() => setExamDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingExamDetail ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedExamDetail ? (
                <>
                  {/* Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">Thời lượng:</span>
                      <span className="font-bold text-gray-800">{selectedExamDetail.durationMinutes} phút</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Số câu hỏi:</span>
                      <span className="font-bold text-gray-800">{selectedExamDetail.questions?.length || 0} câu</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Trạng thái:</span>
                      <span className={`font-bold ${selectedExamDetail.isPublic ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedExamDetail.isPublic ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Chống gian lận:</span>
                      <span className={`font-bold ${selectedExamDetail.settings?.enableProctoring ? 'text-rose-600' : 'text-slate-600'}`}>
                        {selectedExamDetail.settings?.enableProctoring ? 'Bật (Giám sát)' : 'Tắt'}
                      </span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">
                      Danh sách câu hỏi & Đáp án:
                    </h4>
                    {selectedExamDetail.questions?.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            Câu {idx + 1} ({q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : 'Tự luận/Khác'})
                          </span>
                          <span className="text-xs font-semibold text-gray-500">{q.score || 1} điểm</span>
                        </div>
                        <p className="text-xs font-medium text-gray-900 leading-relaxed">{q.content}</p>

                        {/* Options if MC */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt: any) => (
                              <div
                                key={opt.key}
                                className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                                  opt.key === q.correctAnswer
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-slate-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className="font-bold">{opt.key}.</span>
                                <span>{opt.content}</span>
                                {opt.key === q.correctAnswer && (
                                  <span className="ml-auto text-[10px] text-emerald-700 font-bold">ĐÁP ÁN</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Subitems if True/False */}
                        {q.subItems && q.subItems.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {q.subItems.map((sub: any) => (
                              <div key={sub.key} className="p-2 rounded-lg bg-slate-50 border border-gray-200 text-xs flex items-center justify-between">
                                <span className="font-medium text-gray-800">{sub.key}) {sub.content}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {sub.correctAnswer ? 'ĐÚNG' : 'SAI'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 mt-2">
                            <span className="font-bold">Lời giải: </span>{q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setExamDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 5: SUBMISSION DETAIL MODAL */}
      {/* ========================================================== */}
      {subDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  Chi tiết bài làm & Nhật ký giám sát (Admin View)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thí sinh: <span className="font-bold text-gray-800">{selectedSubDetail?.submission?.studentName}</span>
                </p>
              </div>
              <button
                onClick={() => setSubDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingSubDetail ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedSubDetail ? (
                <>
                  {/* Summary Score Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-gray-400 font-semibold block">Điểm số:</span>
                      <span className="text-lg font-black text-emerald-600">
                        {selectedSubDetail.submission?.score} / {selectedSubDetail.submission?.totalScore} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Số điện thoại:</span>
                      <span className="font-bold text-gray-800 font-mono">
                        {selectedSubDetail.submission?.studentPhone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold block">Thời gian nộp:</span>
                      <span className="font-bold text-gray-800">
                        {new Date(selectedSubDetail.submission?.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Proctoring Timeline */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        Nhật ký giám sát thi cử
                      </span>
                      <span className="text-[11px] font-bold text-rose-600">
                        Tổng vi phạm rời màn hình: {selectedSubDetail.submission?.proctoringReport?.outScreenCount || 0} lần
                      </span>
                    </h4>

                    {selectedSubDetail.submission?.proctoringReport?.events?.length > 0 ? (
                      <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                        {selectedSubDetail.submission.proctoringReport.events.map((evt: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                            <span>{evt.details || 'Rời màn hình làm bài'}</span>
                            <span className="font-mono text-[10px] text-rose-600">
                              {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('vi-VN') : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Không phát hiện hành vi gian lận rời màn hình nào trong phiên thi.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSubDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
