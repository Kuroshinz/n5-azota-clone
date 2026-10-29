'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Download,
  Printer,
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Search,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Play,
  RotateCcw
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface LeaderboardEntry {
  rank: number;
  id: string;
  studentName: string;
  score: number;
  totalScore: number;
  submittedAt: string;
}

export default function ExamLeaderboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params?.id as string;
  const highlightSubId = searchParams?.get('highlight') || '';

  const [exam, setExam] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!examId) return;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/exams/${examId}/leaderboard`);
        const data = await res.json();
        if (data.success) {
          setExam(data.exam);
          setLeaderboard(data.leaderboard || []);
          setTotalParticipants(data.totalParticipants || 0);
        }
      } catch (e) {
        console.error('Failed to load leaderboard', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [examId]);

  const handleExportLeaderboardCSV = () => {
    if (leaderboard.length === 0) return;
    const headers = ['Hạng', 'Họ và tên thí sinh', 'Điểm số', 'Thang điểm', 'Thời gian nộp'];
    const rows = leaderboard.map(item => [
      item.rank,
      `"${(item.studentName || 'Ẩn danh').replace(/"/g, '""')}"`,
      item.score,
      item.totalScore,
      `"${new Date(item.submittedAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Xep_Hang_${(exam?.title || 'De_thi').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLeaderboard = leaderboard.filter(item =>
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const top1 = leaderboard.length > 0 ? leaderboard[0] : null;
  const top2 = leaderboard.length > 1 ? leaderboard[1] : null;
  const top3 = leaderboard.length > 2 ? leaderboard[2] : null;

  const myEntry = highlightSubId ? leaderboard.find(e => e.id === highlightSubId) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar examTitle={exam?.title} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
              {/* Actions: Export & Print */}
              <button
                type="button"
                onClick={handleExportLeaderboardCSV}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs active:scale-95 cursor-pointer"
                title="Tải bảng xếp hạng về máy định dạng Excel/CSV"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Xuất Excel/CSV</span>
              </button>

              <Link
                href={`/exam/${examId}/print`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                title="In đề thi hoặc tải bản Word"
              >
                <Printer className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">In đề</span>
              </Link>
            <Link
              href={`/exam/${examId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại phòng thi</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                Bảng Vàng Vinh Danh
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  N5Exam
                </span>
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-600 mt-1 max-w-2xl truncate">
              {exam?.title || 'Đang tải thông tin đề thi...'}
            </p>
          </div>

          <Link
            href={`/exam/${examId}`}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-100 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Vào làm bài thi này</span>
          </Link>
        </div>

        {/* My Highlight Banner if student just submitted */}
        {myEntry && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-indigo-200 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-amber-200">
                #{myEntry.rank}
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Thứ hạng của bạn
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {myEntry.studentName} — Xếp thứ #{myEntry.rank} trên {totalParticipants} bạn
                </h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-600">
                {myEntry.score} / {myEntry.totalScore} đ
              </div>
              <div className="text-[11px] text-slate-400">Đã ghi nhận kết quả</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Đang tải bảng xếp hạng N5Exam...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Chưa có thí sinh nào nộp bài</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Hãy là người đầu tiên chinh phục điểm 10 và ghi tên trên Bảng Vàng N5Exam!
            </p>
            <Link
              href={`/exam/${examId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu làm bài ngay</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium (Bục vinh danh) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl shadow-indigo-950/20">
              <div className="text-center mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Top Xuất Sắc Nhất
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-2 text-white">
                  Ngôi Đền Danh Vọng N5Exam
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-xl mx-auto pt-4">
                {/* Top 2 (Silver) */}
                <div className="flex flex-col items-center text-center">
                  {top2 ? (
                    <>
                      <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-slate-500/20 border-2 border-slate-300">
                          {top2.studentName.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-sm">
                          2
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                        {top2.studentName}
                      </h4>
                      <span className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
                        {top2.score} đ
                      </span>
                    </>
                  ) : (
                    <div className="text-slate-500 text-xs py-8">Chưa có</div>
                  )}
                  <div className="w-full h-20 sm:h-28 rounded-t-2xl bg-slate-800/80 border-t-2 border-slate-400/50 mt-3 flex items-center justify-center text-slate-400 font-bold text-xs">
                    🥈 Hạng 2
                  </div>
                </div>

                {/* Top 1 (Gold) */}
                <div className="flex flex-col items-center text-center -mt-6">
                  {top1 && (
                    <>
                      <div className="relative mb-2">
                        <span className="text-2xl animate-bounce absolute -top-7 left-1/2 -translate-x-1/2">
                          👑
                        </span>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-amber-950 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shadow-amber-500/30 border-3 border-amber-300">
                          {top1.studentName.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-1.5 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-sm">
                          1
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-amber-300 truncate max-w-[110px] sm:max-w-[150px]">
                        {top1.studentName}
                      </h4>
                      <span className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
                        {top1.score} đ
                      </span>
                    </>
                  )}
                  <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-amber-500/30 to-amber-600/10 border-t-3 border-amber-400 mt-3 flex items-center justify-center text-amber-300 font-black text-xs sm:text-sm shadow-inner">
                    🥇 Quán Quân
                  </div>
                </div>

                {/* Top 3 (Bronze) */}
                <div className="flex flex-col items-center text-center">
                  {top3 ? (
                    <>
                      <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-amber-900/20 border-2 border-amber-600">
                          {top3.studentName.charAt(0)}
                        </div>
                        <span className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow-sm">
                          3
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                        {top3.studentName}
                      </h4>
                      <span className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
                        {top3.score} đ
                      </span>
                    </>
                  ) : (
                    <div className="text-slate-500 text-xs py-8">Chưa có</div>
                  )}
                  <div className="w-full h-16 sm:h-22 rounded-t-2xl bg-slate-800/80 border-t-2 border-amber-700/50 mt-3 flex items-center justify-center text-amber-500 font-bold text-xs">
                    🥉 Hạng 3
                  </div>
                </div>
              </div>
            </div>

            {/* Full Rankings Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Bảng xếp hạng chi tiết ({totalParticipants} thí sinh)
                  </h3>
                </div>

                {/* Search by Name */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên thí sinh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">Hạng</th>
                      <th className="px-4 py-3">Họ và tên thí sinh</th>
                      <th className="px-4 py-3 text-center">Điểm số</th>
                      <th className="px-4 py-3 text-right">Thời gian nộp bài</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLeaderboard.map((entry) => {
                      const isMe = entry.id === highlightSubId;
                      return (
                        <tr
                          key={entry.id}
                          className={`transition ${
                            isMe
                              ? 'bg-amber-50/80 font-bold border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            {entry.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                                1
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs">
                                2
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono font-bold">
                                #{entry.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 font-bold text-xs sm:text-sm">
                                {entry.studentName}
                              </span>
                              {isMe && (
                                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs ${
                                entry.score >= 8
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.score >= 5
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {entry.score} / {entry.totalScore} đ
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">
                            {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString('vi-VN') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLeaderboard.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">
                          Không tìm thấy thí sinh nào phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
