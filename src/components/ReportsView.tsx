import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Student, AttendanceRecord, TimeRangeOption, ClassInfo } from '../types';
import { filterAttendanceRecords, exportAttendanceToExcel, printFormattedReport } from '../utils/exportUtils';
import { getStatusBadgeInfo } from '../utils/vietnameseSort';

interface ReportsViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classes: ClassInfo[];
  selectedClass: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  attendanceRecords,
  classes,
  selectedClass,
}) => {
  const [reportClass, setReportClass] = useState<string>(selectedClass);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Class students
  const classStudents = students.filter((s) => reportClass === 'ALL' || s.className === reportClass);

  // Filtered attendance data
  const filteredRecords = filterAttendanceRecords(
    attendanceRecords,
    students,
    reportClass,
    selectedStudentId || undefined,
    timeRange,
    customStartDate,
    customEndDate
  );

  // Calculate summary per student
  const studentSummaryMap: Record<string, {
    student: Student;
    present: number;
    permitted: number;
    unexcused: number;
    late: number;
    sick: number;
    total: number;
    rate: string;
  }> = {};

  classStudents.forEach((st) => {
    studentSummaryMap[st.id] = {
      student: st,
      present: 0,
      permitted: 0,
      unexcused: 0,
      late: 0,
      sick: 0,
      total: 0,
      rate: '100%',
    };
  });

  filteredRecords.forEach((r) => {
    if (studentSummaryMap[r.studentId]) {
      const item = studentSummaryMap[r.studentId];
      if (r.overallStatus === 'Co_Mat') item.present++;
      else if (r.overallStatus === 'Vang_P') item.permitted++;
      else if (r.overallStatus === 'Vang_KP') item.unexcused++;
      else if (r.overallStatus === 'Di_Muon') item.late++;
      else if (r.overallStatus === 'Nghi_Om') item.sick++;

      item.total++;
      const attended = item.present + item.late;
      item.rate = item.total > 0 ? ((attended / item.total) * 100).toFixed(1) + '%' : '100%';
    }
  });

  const summaryList = Object.values(studentSummaryMap).filter((item) => {
    if (selectedStudentId && item.student.id !== selectedStudentId) return false;
    return (
      item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Time label string
  const getTimeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Hôm nay';
      case 'week': return 'Tuần này';
      case 'month': return 'Tháng này';
      case 'semester1': return 'Học kỳ I (2025-2026)';
      case 'semester2': return 'Học kỳ II (2025-2026)';
      case 'year': return 'Cả năm học 2025-2026';
      case 'custom': return `Từ ${customStartDate} đến ${customEndDate}`;
    }
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(filteredRecords, students, reportClass, getTimeLabel());
  };

  const handlePrint = () => {
    printFormattedReport(filteredRecords, reportClass, getTimeLabel());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase">
              Xuất dữ liệu tùy chỉnh
            </span>
            <span className="text-xs text-slate-500 font-medium">Theo Lớp, Học sinh, Tuần, Tháng, Học kỳ, Năm học</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Báo Cáo Tổng Hợp Điểm Danh & Chuyên Cần
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-report-export-excel"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            id="btn-report-print"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>In Báo Cáo (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter Options Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          <span>Bộ lọc dữ liệu chọn lọc</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Select Class */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn Lớp:</label>
            <select
              id="select-report-class"
              value={reportClass}
              onChange={(e) => {
                setReportClass(e.target.value);
                setSelectedStudentId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả các lớp (Khối 10, 11, 12)</option>
              <optgroup label="Khối 10 (10A - 10I)">
                {classes.filter((c) => c.grade === 'Khối 10' || c.name.startsWith('10')).map((c) => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Khối 11 (11A - 11I)">
                {classes.filter((c) => c.grade === 'Khối 11' || c.name.startsWith('11')).map((c) => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Khối 12 (12A - 12I)">
                {classes.filter((c) => c.grade === 'Khối 12' || c.name.startsWith('12')).map((c) => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Select Individual Student */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn Học Sinh Cụ Thể:</label>
            <select
              id="select-report-student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả học sinh trong lớp</option>
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Select Time Range */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Khung Thời Gian:</label>
            <select
              id="select-report-timerange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Hôm nay</option>
              <option value="week">Hàng tuần (Tuần này)</option>
              <option value="month">Hàng tháng (Tháng này)</option>
              <option value="semester1">Học kỳ I</option>
              <option value="semester2">Học kỳ II</option>
              <option value="year">Cả năm học 2025-2026</option>
              <option value="custom">Tùy chọn khoảng ngày...</option>
            </select>
          </div>

          {/* Search name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Lọc tên nhanh:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="input-report-search"
                type="text"
                placeholder="Nhập tên học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Custom date range picker if custom selected */}
        {timeRange === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex items-center space-x-3 text-xs">
            <div>
              <span className="text-slate-500 mr-2">Từ ngày:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <span className="text-slate-500 mr-2">Đến ngày:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Bảng Tổng Hợp Chuyên Cần Lớp {reportClass} — {getTimeLabel()}
          </h3>
          <span className="text-xs text-slate-500">Tổng ghi nhận: {filteredRecords.length} lượt</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và Tên (A-Z)</th>
                <th className="py-3 px-4 text-center text-emerald-700">Có Mặt</th>
                <th className="py-3 px-4 text-center text-amber-700">Vắng Có Phép</th>
                <th className="py-3 px-4 text-center text-rose-700">Vắng Không Phép</th>
                <th className="py-3 px-4 text-center text-orange-700">Đi Muộn</th>
                <th className="py-3 px-4 text-center text-sky-700">Nghỉ Ốm</th>
                <th className="py-3 px-4 text-center font-extrabold text-blue-700">Tỷ Lệ Chuyên Cần</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 text-sm">
              {summaryList.map(({ student, present, permitted, unexcused, late, sick, rate }, idx) => (
                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                    {idx + 1}
                  </td>

                  <td className="py-3 px-4 font-bold text-xs text-slate-700">
                    {student.code}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                    {student.fullName}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {present}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-amber-600">
                    {permitted}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-rose-600">
                    {unexcused}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-orange-600">
                    {late}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-sky-600">
                    {sick}
                  </td>

                  <td className="py-3 px-4 text-center font-extrabold text-blue-700 bg-blue-50/40">
                    {rate}
                  </td>
                </tr>
              ))}

              {summaryList.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 text-sm">
                    Không có dữ liệu điểm danh phù hợp với bộ lọc đã chọn!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
