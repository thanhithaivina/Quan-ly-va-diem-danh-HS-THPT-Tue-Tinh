import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Send,
  Calendar,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Student, AttendanceRecord, AbsenceLeave } from '../types';
import { getStatusBadgeInfo } from '../utils/vietnameseSort';

interface DashboardViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  leaves: AbsenceLeave[];
  selectedClass: string;
  selectedDate: string;
  onNavigate: (tab: string) => void;
  onSendNotificationModal: (student: Student, type: 'Vang_KP' | 'Vang_P' | 'Di_Muon') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  attendanceRecords,
  leaves,
  selectedClass,
  selectedDate,
  onNavigate,
  onSendNotificationModal,
}) => {
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);

  // Filter students for current class
  const classStudents = students.filter((s) => selectedClass === 'ALL' || s.className === selectedClass);
  const totalStudentsCount = classStudents.length;

  // Filter today's attendance for current class & date
  const todayRecords = attendanceRecords.filter(
    (r) => (selectedClass === 'ALL' || r.className === selectedClass) && r.date === selectedDate
  );

  const todayMap = new Map<string, AttendanceRecord>(todayRecords.map((r) => [r.studentId, r]));

  let presentCount = 0;
  let permittedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;
  let sickCount = 0;

  classStudents.forEach((student) => {
    const rec = todayMap.get(student.id);
    if (!rec) return;
    if (rec.overallStatus === 'Co_Mat') presentCount++;
    else if (rec.overallStatus === 'Vang_P') permittedCount++;
    else if (rec.overallStatus === 'Vang_KP') unexcusedCount++;
    else if (rec.overallStatus === 'Di_Muon') lateCount++;
    else if (rec.overallStatus === 'Nghi_Om') sickCount++;
  });

  const totalMarked = presentCount + permittedCount + unexcusedCount + lateCount + sickCount;
  const attendanceRate = totalStudentsCount > 0 ? (((presentCount + lateCount) / totalStudentsCount) * 100).toFixed(1) : '100';

  // Calculate student absence statistics across all recorded history
  const studentAbsenceStats = classStudents.map((student) => {
    const recs = attendanceRecords.filter((r) => r.studentId === student.id);
    const unexcused = recs.filter((r) => r.overallStatus === 'Vang_KP').length;
    const permitted = recs.filter((r) => r.overallStatus === 'Vang_P').length;
    const late = recs.filter((r) => r.overallStatus === 'Di_Muon').length;
    const totalAbsences = unexcused + permitted + late;
    return {
      student,
      unexcused,
      permitted,
      late,
      totalAbsences,
    };
  }).sort((a, b) => b.totalAbsences - a.totalAbsences);

  const topAbsentStudents = studentAbsenceStats.filter((item) => item.totalAbsences > 0).slice(0, 5);

  // Recharts Data: Past 7 days attendance trend
  const past7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (6 - idx));
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

    const recs = attendanceRecords.filter(
      (r) => (selectedClass === 'ALL' || r.className === selectedClass) && r.date === dStr
    );

    const pres = recs.filter((r) => r.overallStatus === 'Co_Mat' || r.overallStatus === 'Di_Muon').length;
    const absP = recs.filter((r) => r.overallStatus === 'Vang_P').length;
    const absKP = recs.filter((r) => r.overallStatus === 'Vang_KP').length;
    const rate = totalStudentsCount > 0 ? Math.round((pres / totalStudentsCount) * 100) : 100;

    return {
      date: dayLabel,
      'Tỷ lệ đi học (%)': rate,
      'Vắng có phép': absP,
      'Vắng không phép': absKP,
    };
  });

  // Pie chart data
  const pieData = [
    { name: 'Có mặt', value: presentCount, color: '#10b981' },
    { name: 'Đi muộn', value: lateCount, color: '#f97316' },
    { name: 'Vắng có phép', value: permittedCount, color: '#f59e0b' },
    { name: 'Vắng không phép', value: unexcusedCount, color: '#ef4444' },
    { name: 'Nghỉ ốm', value: sickCount, color: '#0ea5e9' },
  ].filter((item) => item.value > 0);

  // Call AI Insights API
  const handleFetchAiInsight = async () => {
    setAiInsightLoading(true);
    try {
      const res = await fetch('/api/ai/attendance-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          totalStudents: totalStudentsCount,
          stats: {
            attendanceRate: parseFloat(attendanceRate),
            totalPermitted: permittedCount,
            totalUnexcused: unexcusedCount,
            totalLate: lateCount,
          },
          frequentAbsentStudents: topAbsentStudents.map((s) => ({
            name: s.student.fullName,
            unexcused: s.unexcused,
            permitted: s.permitted,
            late: s.late,
          })),
        }),
      });

      const data = await res.json();
      setAiInsightText(data.analysis || 'Chưa thể tạo phân tích AI vào lúc này.');
    } catch (err) {
      console.error(err);
      setAiInsightText('Đã có lỗi xảy ra khi kết nối với dịch vụ trợ lý AI.');
    } finally {
      setAiInsightLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4 text-blue-300" />
              <span>Báo cáo ngày {selectedDate} — Lớp {selectedClass}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tỷ lệ chuyên cần đạt {attendanceRate}%
            </h2>
            <p className="text-slate-200 text-sm mt-1 max-w-xl">
              Có {presentCount + lateCount}/{totalStudentsCount} học sinh tham gia học tập. Tích hợp tự động gửi thông báo vắng mặt qua Zalo & SMS ngay tức thì.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              id="btn-dashboard-start-attendance"
              onClick={() => onNavigate('attendance')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Điểm danh ngay</span>
            </button>
            <button
              id="btn-dashboard-view-reports"
              onClick={() => onNavigate('reports')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-all text-sm"
            >
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Báo cáo chi tiết</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sĩ số lớp</p>
            <p className="text-2xl font-bold text-slate-900">{totalStudentsCount}</p>
            <span className="text-[11px] text-slate-400">Học sinh A-Z</span>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Có mặt hôm nay</p>
            <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">{attendanceRate}% chuyên cần</span>
          </div>
        </div>

        {/* Late */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đi học muộn</p>
            <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
            <span className="text-[11px] text-slate-400">Cần nhắc nhở</span>
          </div>
        </div>

        {/* Permitted Absences */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vắng có phép</p>
            <p className="text-2xl font-bold text-amber-600">{permittedCount + sickCount}</p>
            <span className="text-[11px] text-slate-400">Có đơn / Nghỉ ốm</span>
          </div>
        </div>

        {/* Unexcused Absences */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vắng không phép</p>
            <p className="text-2xl font-bold text-rose-600">{unexcusedCount}</p>
            <span className="text-[11px] text-rose-500 font-semibold">Gửi Zalo/SMS gấp</span>
          </div>
        </div>
      </div>

      {/* AI Smart Advisor Assistant Card */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-purple-500/30 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Trợ Lý AI Phân Tích Chuyên Cần Sư Phạm</h3>
              <p className="text-xs text-purple-200">Đánh giá xu hướng học tập & đề xuất giải pháp làm việc với phụ huynh</p>
            </div>
          </div>
          <button
            id="btn-ai-analyze"
            onClick={handleFetchAiInsight}
            disabled={aiInsightLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiInsightLoading ? 'Đang phân tích...' : 'Phân tích ngay'}</span>
          </button>
        </div>

        {aiInsightText ? (
          <div className="bg-slate-900/80 rounded-xl p-4 border border-purple-500/20 text-sm leading-relaxed text-slate-200 whitespace-pre-line animate-fadeIn">
            {aiInsightText}
          </div>
        ) : (
          <p className="text-xs text-purple-300 italic">
            Nhấn "Phân tích ngay" để Gemini AI tổng hợp tình hình nghỉ học, phát hiện điểm bất thường và đưa ra lời khuyên cụ thể cho Lớp {selectedClass}.
          </p>
        )}
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xu Hướng Chuyên Cần 7 Ngày Gần Nhất</h3>
              <p className="text-xs text-slate-500">Biểu đồ tỷ lệ học sinh có mặt của Lớp {selectedClass}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Biểu đồ trực quan
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={past7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="Tỷ lệ đi học (%)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart (1 col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="mb-2">
            <h3 className="font-bold text-slate-900 text-base">Cơ Cấu Điểm Danh Hôm Nay</h3>
            <p className="text-xs text-slate-500">Phân bổ trạng thái học sinh ngày {selectedDate}</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-sm">
                Chưa có dữ liệu điểm danh hôm nay
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Absent Students & Immediate Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Frequent Absent Students needing attention */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-base">Học Sinh Nghỉ/Muộn Tần Suất Cao</h3>
            </div>
            <button
              id="btn-view-all-absences"
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topAbsentStudents.length > 0 ? (
              topAbsentStudents.map(({ student, unexcused, permitted, late, totalAbsences }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.code}`}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">{student.fullName}</p>
                      <p className="text-xs text-slate-500">Mã: {student.code} — PH: {student.parentPhone}</p>
                      <div className="flex items-center space-x-2 mt-1 text-[11px]">
                        <span className="text-rose-600 font-medium">Vắng KP: {unexcused}</span>
                        <span>•</span>
                        <span className="text-amber-600">Vắng P: {permitted}</span>
                        <span>•</span>
                        <span className="text-orange-600">Muộn: {late}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-send-alert-${student.id}`}
                    onClick={() => onSendNotificationModal(student, 'Vang_KP')}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Zalo/SMS</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                🎉 Không có học sinh nào vắng học thường xuyên trong lớp {selectedClass}!
              </p>
            )}
          </div>
        </div>

        {/* Today's Attendance Overview List */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Danh Sách Học Sinh Vắng / Muộn Hôm Nay ({selectedDate})
            </h3>
            <button
              id="btn-attendance-tab-link"
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              Điểm danh <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {classStudents.map((student) => {
              const rec = todayMap.get(student.id);
              const status = rec?.overallStatus || 'CHUA_DIEM_DANH';
              if (status === 'Co_Mat') return null; // Only show non-present for quick triage

              const badge = getStatusBadgeInfo(status);

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dotClass}`} />
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{student.fullName}</p>
                      <p className="text-[11px] text-slate-500">{rec?.note || 'Chưa cập nhật lý do'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                    {status !== 'CHUA_DIEM_DANH' && (
                      <button
                        id={`btn-alert-quick-${student.id}`}
                        onClick={() => onSendNotificationModal(student, status as any)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Gửi thông báo PH"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {todayRecords.filter((r) => r.overallStatus !== 'Co_Mat').length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                ✨ Tất cả học sinh lớp {selectedClass} hôm nay đều có mặt đầy đủ!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
