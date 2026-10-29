'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { searchOmnibar } from '@/utils/adminSearch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  Printer,
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
  UploadCloud,
  Eye,
  Server,
  Activity,
  CheckCircle2,
  X,
  ListOrdered,
  AlertTriangle,
  HardDrive,
  BarChart3,
  Copy,
  Sliders,
  Sparkles,
  Crown
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

  // Quick Edit Exam State
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [targetExamForEdit, setTargetExamForEdit] = useState<any>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDuration, setQuickDuration] = useState(45);
  const [quickIsPublic, setQuickIsPublic] = useState(true);
  const [quickAuthorId, setQuickAuthorId] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickMaxViolations, setQuickMaxViolations] = useState(3);
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);

  // Exam Analytics State
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  // Global Omnibar Search (Ctrl + K) State
  const [omnibarOpen, setOmnibarOpen] = useState(false);
  const [omnibarQuery, setOmnibarQuery] = useState('');

  const omnibarResults = useMemo(() => {
    return searchOmnibar(omnibarQuery, usersList, examsList, submissionsList);
  }, [omnibarQuery, usersList, examsList, submissionsList]);

  // Global Keydown Listener for Ctrl + K / Cmd + K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOmnibarOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setOmnibarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());

  // Restore Backup Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<any | null>(null);
  const [backupPreviewStats, setBackupPreviewStats] = useState<{ exams: number; users: number; submissions: number } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const [targetExamForAnalytics, setTargetExamForAnalytics] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
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
    if (!authLoading && (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER'))) {
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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) return;
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

  // Exam Actions: Clone / Duplicate Exam
  const handleCloneExam = async (examId: string, title: string) => {
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone', examId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã nhân bản đề "${title}" thành công!`);
        loadExams();
      } else {
        showToast(data.error || 'Nhân bản thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ khi nhân bản', 'error');
    }
  };

  // Exam Actions: Open Quick Edit
  const handleOpenQuickEdit = (exam: any) => {
    setTargetExamForEdit(exam);
    setQuickTitle(exam.title || '');
    setQuickDuration(exam.durationMinutes || 45);
    setQuickIsPublic(exam.isPublic !== false);
    setQuickAuthorId(exam.author?.id || exam.authorId || '');
    let settings: any = {};
    try {
      settings = typeof exam.settingsJson === 'string' ? JSON.parse(exam.settingsJson) : exam.settings || {};
    } catch {}
    setQuickPassword(settings.password || '');
    setQuickMaxViolations(settings.maxViolations ?? 3);
    setQuickEditModalOpen(true);
  };

  // Exam Actions: Save Quick Edit
  const handleSaveQuickEdit = async () => {
    if (!targetExamForEdit) return;
    if (!quickTitle.trim()) {
      showToast('Tiêu đề không được để trống', 'error');
      return;
    }
    setIsSavingQuickEdit(true);
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: targetExamForEdit.id,
          title: quickTitle.trim(),
          durationMinutes: Number(quickDuration) || 45,
          isPublic: quickIsPublic,
          authorId: quickAuthorId || undefined,
          settings: {
            password: quickPassword.trim() || undefined,
            maxViolations: Number(quickMaxViolations),
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã cập nhật thông tin đề thi thành công');
        setQuickEditModalOpen(false);
        loadExams();
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  // Exam Actions: Open Analytics
  const handleOpenAnalytics = async (examId: string) => {
    setLoadingAnalytics(true);
    setAnalyticsModalOpen(true);
    try {
      const res = await fetch(`/api/admin/exams?id=${examId}&analytics=true`);
      const data = await res.json();
      if (data.success) {
        setTargetExamForAnalytics(data.exam);
        setAnalyticsData(data.analytics);
      } else {
        showToast(data.error || 'Không thể tải thống kê đề thi', 'error');
        setAnalyticsModalOpen(false);
      }
    } catch {
      showToast('Lỗi kết nối khi tải phân tích', 'error');
      setAnalyticsModalOpen(false);
    } finally {
      setLoadingAnalytics(false);
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

  // Export Users to CSV (UTF-8 BOM)
  const handleExportUsersCSV = () => {
    if (usersList.length === 0) {
      showToast('Không có người dùng nào để xuất', 'error');
      return;
    }
    const headers = ['Mã người dùng', 'Họ và tên', 'Số điện thoại', 'Email', 'Vai trò', 'Số đề đã tạo', 'Ngày đăng ký'];
    const rows = usersList.map(u => [
      `"${u.id}"`,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${u.phone || ''}"`,
      `"${u.email || ''}"`,
      u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh',
      u._count?.exams || 0,
      `"${new Date(u.createdAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_Nguoi_dung_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách người dùng thành công!', 'success');
  };

  // Toggle selection for users
  const handleToggleSelectAllUsers = () => {
    if (selectedUserIds.size === usersList.length && usersList.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(usersList.map(u => u.id)));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUserRole = async (newRole: string) => {
    if (selectedUserIds.size === 0) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_role', userIds: Array.from(selectedUserIds), newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Cập nhật thành công');
        setSelectedUserIds(new Set());
        loadUsers();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  const handleBulkUserDelete = async () => {
    if (selectedUserIds.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedUserIds.size} người dùng đã chọn?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_delete', userIds: Array.from(selectedUserIds) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Xóa thành công');
        setSelectedUserIds(new Set());
        loadUsers();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Toggle selection for exams
  const handleToggleSelectAllExams = () => {
    if (selectedExamIds.size === examsList.length && examsList.length > 0) {
      setSelectedExamIds(new Set());
    } else {
      setSelectedExamIds(new Set(examsList.map(e => e.id)));
    }
  };

  const handleToggleSelectExam = (id: string) => {
    setSelectedExamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkExamVisibility = async (isPublic: boolean) => {
    if (selectedExamIds.size === 0) return;
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_visibility', examIds: Array.from(selectedExamIds), isPublic }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Cập nhật thành công');
        setSelectedExamIds(new Set());
        loadExams();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  const handleBulkExamDelete = async () => {
    if (selectedExamIds.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedExamIds.size} đề thi đã chọn?`)) return;
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_delete', examIds: Array.from(selectedExamIds) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Xóa thành công');
        setSelectedExamIds(new Set());
        loadExams();
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  // System Maintenance Actions
  const handleCleanupTestSubmissions = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp các bài làm thử nghiệm hoặc có điểm số bằng 0?')) return;
    setIsCleaning(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_test' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Dọn dẹp thành công');
        loadSystemInfo();
      } else {
        showToast(data.error || 'Dọn dẹp thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã làm mới bộ nhớ đệm hệ thống');
        loadSystemInfo();
      }
    } catch {
      showToast('Lỗi máy chủ', 'error');
    }
  };

  // Backup File Picker Handler
  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const data = json.backup || json;
        const exams = Array.isArray(data.exams) ? data.exams : [];
        const users = Array.isArray(data.users) ? data.users : [];
        const submissions = Array.isArray(data.submissions) ? data.submissions : [];

        setBackupFileContent(data);
        setBackupPreviewStats({
          exams: exams.length,
          users: users.length,
          submissions: submissions.length,
        });
      } catch {
        showToast('File backup không đúng định dạng JSON hợp lệ', 'error');
        setBackupFileContent(null);
        setBackupPreviewStats(null);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Restore Handler
  const handleConfirmRestore = async () => {
    if (!backupFileContent) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backup: backupFileContent }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Khôi phục hệ thống thành công!', 'success');
        setRestoreModalOpen(false);
        setBackupFileContent(null);
        setBackupPreviewStats(null);
        loadSystemInfo();
      } else {
        showToast(data.error || 'Khôi phục thất bại', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi khôi phục dữ liệu', 'error');
    } finally {
      setIsRestoring(false);
    }
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

  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Không có quyền truy cập</h2>
          <p className="text-xs text-gray-500 mb-6">
            Khu vực này chỉ dành riêng cho Quản trị viên và Chủ sở hữu (OWNER). Vui lòng đăng nhập với tài khoản có thẩm quyền.
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
    <div className="min-h-screen bg-slate-100 pb-28 sm:pb-20 font-sans">
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
                {user?.role === 'OWNER' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-0.5 text-[10px] font-black uppercase text-amber-900 border border-amber-300 shadow-xs ring-2 ring-amber-400/20">
                    <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    Chủ Sở Hữu (OWNER)
                  </span>
                ) : (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700 border border-purple-200">
                    Quản trị viên (Admin)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý toàn diện người dùng, đề thi, lượt làm bài và theo dõi vi phạm thi cử
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOmnibarOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 px-3.5 py-2 text-xs font-bold text-purple-900 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Tìm nhanh người dùng, đề thi, bài nộp (Ctrl + K)"
            >
              <Search className="h-3.5 w-3.5 text-purple-600" />
              <span className="hidden sm:inline">Tìm kiếm nhanh...</span>
              <kbd className="inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-purple-700 border border-purple-200 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
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

          {user?.role === 'OWNER' && (
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-200'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Khu vực Chủ Sở Hữu (Sovereign Console)</span>
            </button>
          )}
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

            {/* Bulk Actions Banner for Users */}
            {selectedUserIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-xs text-purple-900 animate-in fade-in">
                <div className="font-bold">
                  Đã chọn <span className="text-purple-700">{selectedUserIds.size}</span> người dùng:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleBulkUserRole('TEACHER')}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg font-bold transition shadow-2xs cursor-pointer"
                  >
                    Chuyển thành Giáo viên
                  </button>
                  <button
                    onClick={() => handleBulkUserRole('USER')}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg font-bold transition shadow-2xs cursor-pointer"
                  >
                    Chuyển thành Học sinh
                  </button>
                  <button
                    onClick={handleBulkUserDelete}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-2xs cursor-pointer"
                  >
                    Xóa đã chọn
                  </button>
                  <button
                    onClick={() => setSelectedUserIds(new Set())}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>
            )}
            {/* Users Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={usersList.length > 0 && selectedUserIds.size === usersList.length}
                        onChange={handleToggleSelectAllUsers}
                        className="rounded text-purple-600 cursor-pointer"
                      />
                    </th>
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
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(u.id)}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="rounded text-purple-600 cursor-pointer"
                        />
                      </td>
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
            {/* Mobile Cards View for Users */}
            <div className="block md:hidden space-y-3">
              {usersList.map((u) => (
                <div
                  key={u.id}
                  className={`rounded-2xl border p-4 transition bg-white shadow-xs space-y-3 ${
                    selectedUserIds.has(u.id) ? 'border-purple-500 ring-1 ring-purple-400 bg-purple-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => handleToggleSelectUser(u.id)}
                        className="rounded text-purple-600 cursor-pointer h-4 w-4"
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-sm uppercase shrink-0">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm truncate">{u.fullName}</span>
                          {u.id === 'admin-master-root' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Master</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{u.phone}</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : u.role === 'TEACHER'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <UserCheck className="h-3 w-3" />
                      {u.role === 'ADMIN' ? 'Quản trị' : u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span className="truncate">{u.email || 'Chưa cập nhật email'}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100 flex-wrap">
                    <button
                      onClick={() => {
                        setTargetUserForPass(u);
                        setResetPassModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Đổi MK</span>
                    </button>

                    <button
                      onClick={() => {
                        setTargetUserForEdit({ ...u });
                        setEditUserModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </button>

                    {u.id !== 'admin-master-root' && u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {usersList.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs bg-slate-50 rounded-2xl border border-gray-200">
                  Không tìm thấy người dùng nào phù hợp
                </div>
              )}
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

            {/* Bulk Actions Banner for Exams */}
            {selectedExamIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs text-indigo-900 animate-in fade-in">
                <div className="font-bold">
                  Đã chọn <span className="text-indigo-700">{selectedExamIds.size}</span> đề thi:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleBulkExamVisibility(true)}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Công khai tất cả</span>
                  </button>
                  <button
                    onClick={() => handleBulkExamVisibility(false)}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Chuyển riêng tư</span>
                  </button>
                  <button
                    onClick={handleBulkExamDelete}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-2xs cursor-pointer"
                  >
                    Xóa đã chọn
                  </button>
                  <button
                    onClick={() => setSelectedExamIds(new Set())}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>
            )}
            {/* Exams Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={examsList.length > 0 && selectedExamIds.size === examsList.length}
                        onChange={handleToggleSelectAllExams}
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                    </th>
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
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedExamIds.has(e.id)}
                          onChange={() => handleToggleSelectExam(e.id)}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                      </td>
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
                          {/* Analytics: Score Distribution & Difficulty */}
                          <button
                            onClick={() => handleOpenAnalytics(e.id)}
                            title="Phân tích phổ điểm & Độ khó câu hỏi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => handleOpenQuickEdit(e)}
                            title="Sửa nhanh thông tin & Tác giả đề thi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>

                          {/* Full Question Editor */}
                          <Link
                            href={`/teacher/edit/${e.id}`}
                            title="Soạn thảo & Chỉnh sửa câu hỏi chi tiết"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>

                          {/* Clone Exam */}
                          <button
                            onClick={() => handleCloneExam(e.id, e.title)}
                            title="Nhân bản đề thi (Clone)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

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
                            href={`/exam/${e.id}/print`}
                            target="_blank"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="In đề thi / Xuất Word (.doc)"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
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
            {/* Mobile Cards View for Exams */}
            <div className="block md:hidden space-y-3">
              {examsList.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-2xl border p-4 transition bg-white shadow-xs space-y-3 ${
                    selectedExamIds.has(e.id) ? 'border-indigo-500 ring-1 ring-indigo-400 bg-indigo-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedExamIds.has(e.id)}
                        onChange={() => handleToggleSelectExam(e.id)}
                        className="rounded text-indigo-600 cursor-pointer h-4 w-4 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm leading-snug break-words">{e.title}</h4>
                        <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">ID: {e.id}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleVisibility(e.id, !e.isPublic)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        e.isPublic
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {e.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      <span>{e.isPublic ? 'Công khai' : 'Riêng tư'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Tác giả:</span>
                      <strong className="text-gray-800 truncate block">{e.author?.fullName || 'Ẩn danh'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Quy mô:</span>
                      <span>{e.totalQuestions} câu • {e.durationMinutes} phút</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100 flex-wrap">
                    <Link
                      href={`/teacher/submissions/${e.id}`}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{e._count?.submissions || 0} bài nộp</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/exam/${e.id}/print`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        title="In đề / Xuất Word"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => handleOpenAnalytics(e.id)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        title="Phổ điểm & Độ khó"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenQuickEdit(e)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        title="Sửa nhanh"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </button>

                      <Link
                        href={`/teacher/edit/${e.id}`}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        title="Sửa câu hỏi"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => handleCloneExam(e.id, e.title)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Nhân bản (Clone)"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteExam(e.id, e.title)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        title="Xóa đề"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {examsList.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs bg-slate-50 rounded-2xl border border-gray-200">
                  Không tìm thấy đề thi nào phù hợp
                </div>
              )}
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
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải bản sao lưu (JSON)</span>
                </button>

                <button
                  onClick={() => setRestoreModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                  <span>Khôi phục dữ liệu từ bản sao lưu (JSON)</span>
                </button>

                <button
                  onClick={handleClearCache}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition cursor-pointer"
                  title="Làm mới bộ nhớ đệm và dữ liệu tạm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                  <span>Làm mới Cache</span>
                </button>

                <button
                  onClick={handleCleanupTestSubmissions}
                  disabled={isCleaning}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                  title="Xóa các bài nộp kiểm thử điểm 0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isCleaning ? 'Đang dọn dẹp...' : 'Dọn dẹp bài nộp rác'}</span>
                </button>
              </div>
            </div>
            {/* Live System Activity Feed / Audit Trail */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <span>Nhật ký Sự kiện & Hoạt động Hệ thống (Audit Trail)</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                  Thời gian thực
                </span>
              </div>

              <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto pr-1">
                {(systemInfo?.activityLogs || []).map((act: any) => (
                  <div key={act.id} className="py-3 flex items-start gap-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      act.badgeColor === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : act.badgeColor === 'purple'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {act.type === 'user_registered' ? '👤' : act.type === 'exam_created' ? '📄' : '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 truncate">{act.title}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(act.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{act.description}</p>
                    </div>
                  </div>
                ))}
                {(!systemInfo?.activityLogs || systemInfo.activityLogs.length === 0) && (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Chưa có nhật ký sự kiện nào được ghi nhận
                  </div>
                )}
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

            <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
              {selectedExamDetail && (
                <Link
                  href={`/teacher/edit/${selectedExamDetail.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm shadow-purple-200"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Mở Trình Soạn Thảo Đề Chi Tiết</span>
                </Link>
              )}
              <button
                onClick={() => setExamDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition ml-auto"
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

      {/* ========================================================== */}
      {/* MODAL 6: QUICK EDIT EXAM MODAL */}
      {/* ========================================================== */}
      {quickEditModalOpen && targetExamForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                Sửa Nhanh Thông Tin Đề Thi
              </h3>
              <button
                onClick={() => setQuickEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề đề thi</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    min="1"
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái công khai</label>
                  <select
                    value={quickIsPublic ? 'public' : 'private'}
                    onChange={(e) => setQuickIsPublic(e.target.value === 'public')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="public">Công khai</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>
              </div>

              {/* Author Reassignment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Chuyển quyền tác giả / Người sở hữu đề
                </label>
                <select
                  value={quickAuthorId}
                  onChange={(e) => setQuickAuthorId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="">Giữ nguyên tác giả hiện tại</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.phone}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu PIN đề (nếu có)</label>
                  <input
                    type="text"
                    placeholder="Không có mật khẩu"
                    value={quickPassword}
                    onChange={(e) => setQuickPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giới hạn vi phạm tab</label>
                  <select
                    value={quickMaxViolations}
                    onChange={(e) => setQuickMaxViolations(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value={1}>1 lần (Nghiêm ngặt)</option>
                    <option value={3}>3 lần (Tiêu chuẩn N5Exam)</option>
                    <option value={5}>5 lần (Linh hoạt)</option>
                    <option value={0}>Không thu bài</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/teacher/edit/${targetExamForEdit.id}`}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa toàn bộ câu hỏi và đáp án bằng Trình soạn thảo chuyên sâu &rarr;</span>
                </Link>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingQuickEdit}
                onClick={handleSaveQuickEdit}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5"
              >
                {isSavingQuickEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 7: EXAM ANALYTICS & DIFFICULTY MODAL */}
      {/* ========================================================== */}
      {analyticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  Phân Tích Phổ Điểm & Độ Khó Câu Hỏi
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 max-w-lg truncate">
                  Đề thi: <span className="font-bold text-gray-800">{targetExamForAnalytics?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setAnalyticsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingAnalytics ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-gray-500">Đang tổng hợp dữ liệu phổ điểm...</span>
                </div>
              ) : analyticsData ? (
                <>
                  {/* Metric Overview Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Số lượt nộp bài</span>
                      <span className="text-2xl font-black text-indigo-900 mt-1 block">{analyticsData.totalSubmissions}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Điểm trung bình</span>
                      <span className="text-2xl font-black text-indigo-600 mt-1 block">{analyticsData.averageScore}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Điểm cao nhất</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">{analyticsData.highestScore}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Điểm thấp nhất</span>
                      <span className="text-2xl font-black text-rose-600 mt-1 block">{analyticsData.lowestScore}</span>
                    </div>
                  </div>

                  {/* Score Distribution Histogram */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                      <span>Phân bố phổ điểm (Histogram)</span>
                      <span className="text-[11px] font-normal text-gray-400">Thang điểm 10</span>
                    </h4>

                    <div className="space-y-2 pt-1">
                      {[
                        { label: '8.0 - 10.0 đ (Giỏi / Xuất sắc)', key: '8-10', color: 'bg-emerald-500' },
                        { label: '6.0 - 7.9 đ (Khá)', key: '6-8', color: 'bg-indigo-500' },
                        { label: '4.0 - 5.9 đ (Trung bình)', key: '4-6', color: 'bg-amber-500' },
                        { label: '2.0 - 3.9 đ (Yếu)', key: '2-4', color: 'bg-orange-500' },
                        { label: '0.0 - 1.9 đ (Kém)', key: '0-2', color: 'bg-rose-500' },
                      ].map((bar) => {
                        const count = analyticsData.scoreDistribution?.[bar.key] || 0;
                        const pct = analyticsData.totalSubmissions > 0
                          ? Math.round((count / analyticsData.totalSubmissions) * 100)
                          : 0;

                        return (
                          <div key={bar.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                              <span>{bar.label}</span>
                              <span className="font-mono text-gray-500">{count} bài ({pct}%)</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Accuracy & Difficulty */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Độ khó & Tỷ lệ làm đúng từng câu hỏi
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-gray-600 font-bold uppercase border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2">Câu</th>
                            <th className="px-3 py-2">Nội dung tóm tắt</th>
                            <th className="px-3 py-2 text-center">Làm đúng</th>
                            <th className="px-3 py-2 text-center">Tỷ lệ đúng</th>
                            <th className="px-3 py-2 text-right">Đánh giá độ khó</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {analyticsData.questionStats?.map((qs: any) => (
                            <tr key={qs.questionId} className="hover:bg-slate-50/60">
                              <td className="px-3 py-2 font-bold text-gray-900">Câu {qs.displayNumber}</td>
                              <td className="px-3 py-2 max-w-xs truncate text-gray-600">{qs.content}</td>
                              <td className="px-3 py-2 text-center text-emerald-700 font-semibold">{qs.correctCount} / {analyticsData.totalSubmissions}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="font-bold">{qs.accuracy}%</span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {qs.isDifficult ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3" />
                                    Câu khó / Tỷ lệ sai cao
                                  </span>
                                ) : qs.accuracy >= 80 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Câu cơ bản
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Vừa phải</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setAnalyticsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 8: RESTORE BACKUP MODAL */}
      {/* ========================================================== */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-purple-600" />
                Khôi phục dữ liệu từ bản sao lưu (JSON)
              </h3>
              <button
                onClick={() => {
                  setRestoreModalOpen(false);
                  setBackupFileContent(null);
                  setBackupPreviewStats(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Tải lên tệp JSON sao lưu đã xuất từ hệ thống N5Exam. Dữ liệu các đề thi, tài khoản người dùng và bài làm sẽ được khôi phục nguyên vẹn.
              </p>

              <div className="border-2 border-dashed border-purple-200 bg-purple-50/40 rounded-2xl p-6 text-center hover:bg-purple-50 transition cursor-pointer">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBackupFileSelect}
                  className="hidden"
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input" className="cursor-pointer block">
                  <UploadCloud className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-purple-900 block">
                    Click để chọn tệp sao lưu (.json)
                  </span>
                  <span className="text-[11px] text-purple-600 mt-1 block">
                    Hỗ trợ tệp export JSON của N5Exam
                  </span>
                </label>
              </div>

              {backupPreviewStats && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tệp sao lưu hợp lệ! Nội dung sẵn sàng khôi phục:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase">Đề thi</span>
                      <span className="text-indigo-600 text-sm">{backupPreviewStats.exams}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase">Tài khoản</span>
                      <span className="text-purple-600 text-sm">{backupPreviewStats.users}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] block uppercase">Bài làm</span>
                      <span className="text-emerald-600 text-sm">{backupPreviewStats.submissions}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreModalOpen(false);
                    setBackupFileContent(null);
                    setBackupPreviewStats(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!backupFileContent || isRestoring}
                  onClick={handleConfirmRestore}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRestoring ? 'Đang khôi phục...' : 'Bắt đầu khôi phục dữ liệu'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================== */}
      {/* MODAL 9: GLOBAL OMNIBAR SEARCH MODAL (Ctrl + K)           */}
      {/* ========================================================== */}
      {omnibarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-20 animate-in fade-in"
          onClick={() => setOmnibarOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-slate-50/70">
              <Search className="h-5 w-5 text-purple-600 shrink-0" />
              <input
                type="text"
                autoFocus
                value={omnibarQuery}
                onChange={(e) => setOmnibarQuery(e.target.value)}
                placeholder="Tìm kiếm người dùng, đề thi, bài nộp (gõ để tìm tức thì)..."
                className="flex-1 bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {omnibarQuery && (
                <button
                  type="button"
                  onClick={() => setOmnibarQuery('')}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 rounded-md"
                >
                  Xóa
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-500 border border-gray-200 shadow-2xs">
                ESC để đóng
              </kbd>
              <button
                type="button"
                onClick={() => setOmnibarOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs divide-y divide-gray-100">
              {omnibarQuery.trim() === '' ? (
                <div className="py-8 text-center text-gray-400 space-y-2">
                  <p className="font-semibold text-gray-600 text-xs">
                    Gõ từ khóa để tra cứu tức thời người dùng, đề thi hoặc bài làm
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Gợi ý: Tìm theo tên học sinh, số điện thoại, tiêu đề đề thi hoặc mã đề
                  </p>
                </div>
              ) : omnibarResults.total === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="font-bold text-sm text-gray-700">Không tìm thấy kết quả nào</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Không có người dùng, đề thi hay bài nộp nào khớp với từ khóa "{omnibarQuery}"
                  </p>
                </div>
              ) : (
                <>
                  {/* Category: Users */}
                  {omnibarResults.users.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-black uppercase text-purple-700 tracking-wider mb-2 px-2 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>Người dùng ({omnibarResults.users.length})</span>
                      </div>
                      <div className="space-y-1">
                        {omnibarResults.users.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setTargetUserForEdit(u);
                              setEditUserModalOpen(true);
                              setOmnibarOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-xs uppercase">
                                {u.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 group-hover:text-purple-700 block">
                                  {u.fullName}
                                </span>
                                <span className="text-[11px] text-gray-500 font-mono">
                                  {u.phone} {u.email ? `• ${u.email}` : ''}
                                </span>
                              </div>
                            </div>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              {u.role === 'ADMIN' ? 'Quản trị' : u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Exams */}
                  {omnibarResults.exams.length > 0 && (
                    <div className="pt-3">
                      <div className="text-[11px] font-black uppercase text-indigo-700 tracking-wider mb-2 px-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Đề thi ({omnibarResults.exams.length})</span>
                      </div>
                      <div className="space-y-1">
                        {omnibarResults.exams.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              handleOpenExamDetail(e.id);
                              setOmnibarOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 transition cursor-pointer group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-gray-900 group-hover:text-indigo-700 block truncate">
                                {e.title}
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono">
                                Mã: {e.id} • Tác giả: {e.author?.fullName || 'Ẩn danh'}
                              </span>
                            </div>
                            <span className="text-[11px] text-indigo-600 font-bold group-hover:underline shrink-0">
                              Xem chi tiết →
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Submissions */}
                  {omnibarResults.submissions.length > 0 && (
                    <div className="pt-3">
                      <div className="text-[11px] font-black uppercase text-emerald-700 tracking-wider mb-2 px-2 flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Bài nộp ({omnibarResults.submissions.length})</span>
                      </div>
                      <div className="space-y-1">
                        {omnibarResults.submissions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              handleOpenSubDetail(s.id);
                              setOmnibarOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 transition cursor-pointer group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-gray-900 group-hover:text-emerald-700 block">
                                {s.studentName}
                              </span>
                              <span className="text-[11px] text-gray-500 truncate block">
                                Đề: {s.exam?.title || 'Đề thi'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-700 text-sm">{s.score}</span>
                              <span className="text-gray-400 text-[10px]"> / {s.totalScore || 10} đ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
