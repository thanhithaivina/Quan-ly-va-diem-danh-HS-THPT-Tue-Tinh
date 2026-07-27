import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  AlertCircle,
  Search,
  Filter,
  Send,
  Save,
  MessageSquare,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  QrCode,
  UserCheck,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Info,
  CalendarDays,
  CheckSquare
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { sortStudentsAlphabetically, getStatusBadgeInfo } from '../utils/vietnameseSort';
import {
  getVietnameseDayOfWeek,
  getScheduledSubject,
  getFullDaySchedule,
  SUBJECT_LIST,
  PERIOD_TIMES,
} from '../utils/timetable';
import { TimetableManagementView } from './TimetableManagementView';

interface AttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedClass: string;
  selectedDate: string;
  onSaveAttendance: (updatedRecords: AttendanceRecord[]) => void;
  onSendNotificationModal: (
    student: Student,
    type: 'Vang_KP' | 'Vang_P' | 'Di_Muon',
    defaultReason?: string
  ) => void;
  onSelectDate?: (date: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendanceRecords,
  selectedClass,
  selectedDate: propSelectedDate,
  onSaveAttendance,
  onSendNotificationModal,
  onSelectDate,
}) => {
  // Local or prop date state
  const [currentDate, setCurrentDate] = useState<string>(propSelectedDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (propSelectedDate) {
      setCurrentDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    if (onSelectDate) {
      onSelectDate(newDate);
    }
  };

  const dayInfo = getVietnameseDayOfWeek(currentDate);

  // Period selection state: 0 = All Day / Cả ngày, 1..10 = Specific Period / Tiết 1..10
  const [selectedPeriodNum, setSelectedPeriodNum] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán Học');
  const [activeSession, setActiveSession] = useState<'Morning' | 'Afternoon'>('Morning');
  const [viewMode, setViewMode] = useState<'single_period' | 'all_periods' | 'overall'>('single_period');
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);

  // Auto-update subject when period or date changes
  useEffect(() => {
    if (selectedPeriodNum > 0) {
      const scheduled = getScheduledSubject(selectedClass, currentDate, selectedPeriodNum);
      setSelectedSubject(scheduled);
    }
  }, [selectedPeriodNum, currentDate, selectedClass]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter students by class and sort alphabetically by Vietnamese name
  const classStudents = sortStudentsAlphabetically(
    students.filter((s) => selectedClass === 'ALL' || s.className === selectedClass)
  );

  // Map existing records for date & class
  const recordMap = new Map<string, AttendanceRecord>(
    attendanceRecords
      .filter((r) => r.date === currentDate && (selectedClass === 'ALL' || r.className === selectedClass))
      .map((r) => [r.studentId, r])
  );

  // Local state for edits
  const [localRecords, setLocalRecords] = useState<Record<string, Partial<AttendanceRecord>>>(() => {
    const init: Record<string, Partial<AttendanceRecord>> = {};
    const fullSchedule = getFullDaySchedule(selectedClass, currentDate);

    classStudents.forEach((student) => {
      const existing = recordMap.get(student.id);
      if (existing) {
        init[student.id] = { ...existing };
      } else {
        init[student.id] = {
          studentId: student.id,
          date: currentDate,
          className: student.className,
          overallStatus: 'Co_Mat',
          periods: { 1: 'Co_Mat', 2: 'Co_Mat', 3: 'Co_Mat', 4: 'Co_Mat', 5: 'Co_Mat' },
          periodSubjects: { ...fullSchedule },
          selectedSubject: fullSchedule[1] || 'Toán Học',
          note: '',
          minutesLate: 0,
          notifiedParent: false,
        };
      }
    });
    return init;
  });

  // Keep local records in sync if date changes
  useEffect(() => {
    const fullSchedule = getFullDaySchedule(selectedClass, currentDate);
    const newRecordMap = new Map<string, AttendanceRecord>(
      attendanceRecords
        .filter((r) => r.date === currentDate && (selectedClass === 'ALL' || r.className === selectedClass))
        .map((r) => [r.studentId, r])
    );

    const updated: Record<string, Partial<AttendanceRecord>> = {};
    classStudents.forEach((student) => {
      const existing = newRecordMap.get(student.id);
      if (existing) {
        updated[student.id] = { ...existing };
      } else {
        updated[student.id] = {
          studentId: student.id,
          date: currentDate,
          className: student.className,
          overallStatus: 'Co_Mat',
          periods: { 1: 'Co_Mat', 2: 'Co_Mat', 3: 'Co_Mat', 4: 'Co_Mat', 5: 'Co_Mat' },
          periodSubjects: { ...fullSchedule },
          selectedSubject: fullSchedule[selectedPeriodNum] || selectedSubject,
          note: '',
          minutesLate: 0,
          notifiedParent: false,
        };
      }
    });
    setLocalRecords(updated);
  }, [currentDate, selectedClass]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Status handler for specific period
  const handleUpdatePeriodStatus = (studentId: string, periodNum: number, status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const current = prev[studentId] || {};
      const newPeriods = { ...(current.periods || {}), [periodNum]: status };
      const newPeriodSubjects = { ...(current.periodSubjects || {}), [periodNum]: selectedSubject };

      // Determine overall status based on periods
      const values = Object.values(newPeriods);
      let overall: AttendanceStatus = 'Co_Mat';
      if (values.includes('Vang_KP')) overall = 'Vang_KP';
      else if (values.includes('Vang_P')) overall = 'Vang_P';
      else if (values.includes('Di_Muon')) overall = 'Di_Muon';
      else if (values.includes('Nghi_Om')) overall = 'Nghi_Om';

      return {
        ...prev,
        [studentId]: {
          ...current,
          periods: newPeriods,
          periodSubjects: newPeriodSubjects,
          selectedSubject: selectedSubject,
          overallStatus: overall,
        },
      };
    });
  };

  // Status handler for overall session / day
  const handleUpdateOverallStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const current = prev[studentId] || {};
      const updatedPeriods: Record<number, AttendanceStatus> = {};
      const targetPeriods = activeSession === 'Morning' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
      targetPeriods.forEach((p) => {
        updatedPeriods[p] = status;
      });

      return {
        ...prev,
        [studentId]: {
          ...current,
          overallStatus: status,
          periods: { ...(current.periods || {}), ...updatedPeriods },
          minutesLate: status === 'Di_Muon' ? (current.minutesLate || 15) : 0,
        },
      };
    });
  };

  // Note handler
  const handleUpdateNote = (studentId: string, note: string) => {
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Bulk action for current period + subject
  const handleMarkAllPeriod = (status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const next = { ...prev };
      classStudents.forEach((student) => {
        const current = next[student.id] || {};
        const updatedPeriods = { ...(current.periods || {}), [selectedPeriodNum]: status };
        const updatedSubjects = { ...(current.periodSubjects || {}), [selectedPeriodNum]: selectedSubject };

        const values = Object.values(updatedPeriods);
        let overall: AttendanceStatus = 'Co_Mat';
        if (values.includes('Vang_KP')) overall = 'Vang_KP';
        else if (values.includes('Vang_P')) overall = 'Vang_P';
        else if (values.includes('Di_Muon')) overall = 'Di_Muon';
        else if (values.includes('Nghi_Om')) overall = 'Nghi_Om';

        next[student.id] = {
          ...current,
          periods: updatedPeriods,
          periodSubjects: updatedSubjects,
          selectedSubject: selectedSubject,
          overallStatus: overall,
        };
      });
      return next;
    });

    const statusLabel = getStatusBadgeInfo(status).label;
    showToast(`Đã đánh dấu Tiết ${selectedPeriodNum} (${selectedSubject}) cho tất cả học sinh: ${statusLabel}`);
  };

  // Bulk action for overall session
  const handleMarkAllOverall = (status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const next = { ...prev };
      classStudents.forEach((student) => {
        const current = next[student.id] || {};
        const updatedPeriods: Record<number, AttendanceStatus> = {};
        const targetPeriods = activeSession === 'Morning' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
        targetPeriods.forEach((p) => {
          updatedPeriods[p] = status;
        });

        next[student.id] = {
          ...current,
          overallStatus: status,
          periods: { ...(current.periods || {}), ...updatedPeriods },
        };
      });
      return next;
    });
    showToast(`Đã đánh dấu tất cả học sinh là: ${getStatusBadgeInfo(status).label}`);
  };

  // Save changes
  const handleSaveAll = () => {
    const recordsToSave: AttendanceRecord[] = classStudents.map((student) => {
      const item = localRecords[student.id] || {};
      return {
        id: item.id || `att_${student.id}_${currentDate}`,
        studentId: student.id,
        date: currentDate,
        className: student.className,
        periods: item.periods || { 1: 'Co_Mat', 2: 'Co_Mat', 3: 'Co_Mat', 4: 'Co_Mat', 5: 'Co_Mat' },
        periodSubjects: item.periodSubjects || getFullDaySchedule(student.className, currentDate),
        selectedSubject: selectedSubject,
        overallStatus: item.overallStatus || 'Co_Mat',
        note: item.note || '',
        minutesLate: item.minutesLate || 0,
        updatedAt: new Date().toISOString(),
        notifiedParent: item.notifiedParent || false,
      };
    });

    onSaveAttendance(recordsToSave);
    showToast(`Đã lưu điểm danh lớp ${selectedClass} (${dayInfo.dayName}, ${dayInfo.formattedDate}) thành công!`);
  };

  // Filtered display list
  const filteredStudents = classStudents.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.code.toLowerCase().includes(searchTerm.toLowerCase());

    const rec = localRecords[student.id];
    const status = viewMode === 'single_period'
      ? (rec?.periods?.[selectedPeriodNum] || 'Co_Mat')
      : (rec?.overallStatus || 'Co_Mat');

    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate quick metrics
  const absentInSelectedPeriod = classStudents.filter((s) => {
    const pStatus = localRecords[s.id]?.periods?.[selectedPeriodNum];
    return pStatus && pStatus !== 'Co_Mat';
  });

  const fullDaySchedule = getFullDaySchedule(selectedClass, currentDate);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Card: Date, Class & Timetable Selector */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-xl text-xs font-extrabold uppercase tracking-wide">
                Lớp {selectedClass}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center space-x-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{dayInfo.dayName}, {dayInfo.formattedDate}</span>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Điểm Danh Theo Thời Khóa Biểu
            </h2>
          </div>

          {/* Date Picker & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs space-x-2">
              <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-600 font-bold hidden sm:inline">Chọn ngày:</span>
              <input
                type="date"
                id="input-attendance-date-picker"
                value={currentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
              />
            </div>

            <button
              type="button"
              id="btn-quick-date-today"
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hôm nay
            </button>

            <button
              type="button"
              id="btn-open-timetable-modal"
              onClick={() => setIsTimetableModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Xem TKB Tuần</span>
            </button>

            <button
              type="button"
              id="btn-save-attendance-top"
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu điểm danh</span>
            </button>
          </div>
        </div>

        {/* Timetable Period & Subject Selection Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Chọn Tiết Mấy & Môn Học Cần Điểm Danh:</span>
            </p>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                id="btn-viewmode-single"
                onClick={() => setViewMode('single_period')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'single_period'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theo tiết & Môn chọn
              </button>
              <button
                type="button"
                id="btn-viewmode-all"
                onClick={() => setViewMode('all_periods')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'all_periods'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ma trận các tiết
              </button>
              <button
                type="button"
                id="btn-viewmode-overall"
                onClick={() => setViewMode('overall')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'overall'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả buổi / Cả ngày
              </button>
            </div>
          </div>

          {/* Period Selector Tabs (Tiết 1 - 10) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pNum) => {
              const subj = fullDaySchedule[pNum] || 'Chưa xếp';
              const isSelected = selectedPeriodNum === pNum && viewMode === 'single_period';
              const isMorning = pNum <= 5;

              return (
                <button
                  key={pNum}
                  type="button"
                  id={`btn-select-period-${pNum}`}
                  onClick={() => {
                    setSelectedPeriodNum(pNum);
                    setViewMode('single_period');
                    setActiveSession(isMorning ? 'Morning' : 'Afternoon');
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : 'bg-slate-50 hover:bg-blue-50/70 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      Tiết {pNum}
                    </span>
                    <span className={`text-[9px] font-semibold px-1 rounded ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isMorning ? 'Sáng' : 'Chiều'}
                    </span>
                  </div>

                  <p className={`text-xs font-extrabold truncate mt-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {subj}
                  </p>

                  <span className={`text-[9px] mt-1 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {PERIOD_TIMES[pNum]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Period + Subject Detail & Override Controls */}
          {viewMode === 'single_period' && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  T{selectedPeriodNum}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blue-900">
                      Thời gian: {PERIOD_TIMES[selectedPeriodNum]}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-blue-700 font-semibold">
                      {dayInfo.dayName} ({dayInfo.formattedDate})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-600">Môn theo thời khóa biểu:</span>
                    <span className="font-extrabold text-blue-950 text-sm">{selectedSubject}</span>
                  </div>
                </div>
              </div>

              {/* Subject dropdown selector / override */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 bg-white border border-blue-300 rounded-xl px-3 py-1.5 shadow-xs">
                  <span className="text-xs font-bold text-slate-700">Đổi môn điểm danh:</span>
                  <select
                    id="select-subject-override"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-transparent font-extrabold text-blue-900 text-xs focus:outline-none cursor-pointer"
                  >
                    {SUBJECT_LIST.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulk Actions for this Period */}
                <button
                  type="button"
                  id="btn-mark-all-period-present"
                  onClick={() => handleMarkAllPeriod('Co_Mat')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tất cả có mặt T{selectedPeriodNum}</span>
                </button>

                <button
                  type="button"
                  id="btn-mark-all-period-absent"
                  onClick={() => handleMarkAllPeriod('Vang_KP')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Đánh dấu vắng T{selectedPeriodNum}</span>
                </button>
              </div>
            </div>
          )}

          {/* Session Bulk Actions if in Overall / All Periods View */}
          {viewMode === 'overall' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Đang chọn chế độ:</span>
                <span className="text-xs font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                  Đánh dấu tổng hợp cả buổi
                </span>
                {/* Session switcher */}
                <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveSession('Morning')}
                    className={`px-2.5 py-1 rounded font-bold ${
                      activeSession === 'Morning' ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Sáng (Tiết 1-5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSession('Afternoon')}
                    className={`px-2.5 py-1 rounded font-bold ${
                      activeSession === 'Afternoon' ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Chiều (Tiết 6-10)
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleMarkAllOverall('Co_Mat')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tất cả có mặt
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllOverall('Vang_KP')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Đánh dấu vắng không phép
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Filter & Search */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-attendance-search"
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            <span className="text-slate-500 font-bold mr-1 shrink-0">Lọc theo:</span>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'Co_Mat', label: 'Có mặt' },
              { key: 'Vang_P', label: 'Có phép' },
              { key: 'Vang_KP', label: 'Không phép' },
              { key: 'Di_Muon', label: 'Đi muộn' },
              { key: 'Nghi_Om', label: 'Nghỉ ốm' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                id={`btn-filter-status-${item.key}`}
                onClick={() => setStatusFilter(item.key)}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === item.key
                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Attendance List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 w-12 text-center border-r border-slate-700">STT</th>
                <th className="py-3.5 px-4 border-r border-slate-700 min-w-[200px]">Học Sinh</th>
                <th className="py-3.5 px-3 border-r border-slate-700 w-28">Mã HS</th>

                {/* Dynamic Columns Based on View Mode */}
                {viewMode === 'single_period' && (
                  <th className="py-3.5 px-4 border-r border-slate-700 min-w-[340px]">
                    Điểm Danh Tiết {selectedPeriodNum} • {selectedSubject}
                  </th>
                )}

                {viewMode === 'all_periods' && (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <th
                        key={p}
                        className="py-2 px-1 text-center border-r border-slate-700 min-w-[65px]"
                        title={`Tiết ${p}: ${fullDaySchedule[p] || ''}`}
                      >
                        <div className="text-[10px] font-black">T{p}</div>
                        <div className="text-[9px] font-normal opacity-85 truncate max-w-[55px] mx-auto">
                          {fullDaySchedule[p] || 'Tự học'}
                        </div>
                      </th>
                    ))}
                  </>
                )}

                {viewMode === 'overall' && (
                  <th className="py-3.5 px-4 border-r border-slate-700 min-w-[320px]">
                    Trạng Thái Buổi {activeSession === 'Morning' ? 'Sáng' : 'Chiều'}
                  </th>
                )}

                <th className="py-3.5 px-4 border-r border-slate-700 min-w-[180px]">Ghi Chú / Lý Do</th>
                <th className="py-3.5 px-3 text-center w-28">Gửi Zalo PH</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredStudents.map((student, idx) => {
                const rec = localRecords[student.id] || {};
                const currentStatus = rec.overallStatus || 'Co_Mat';
                const currentPeriods = rec.periods || {};
                const singlePStatus = currentPeriods[selectedPeriodNum] || 'Co_Mat';

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      singlePStatus === 'Vang_KP' ? 'bg-rose-50/40' : singlePStatus === 'Vang_P' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* Student Info */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.code}`}
                          alt={student.fullName}
                          className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{student.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">SĐT PH: {student.parentPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Code & Role */}
                    <td className="py-3 px-3 border-r border-slate-100">
                      <span className="font-mono font-bold text-blue-700 text-xs">{student.code}</span>
                      <p className="text-[10px] text-slate-500 font-medium">{student.role}</p>
                    </td>

                    {/* SINGLE PERIOD MODE CONTROLS */}
                    {viewMode === 'single_period' && (
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-pstatus-comat-${student.id}`}
                            onClick={() => handleUpdatePeriodStatus(student.id, selectedPeriodNum, 'Co_Mat')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              singlePStatus === 'Co_Mat'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                            }`}
                          >
                            ✓ Có mặt
                          </button>

                          <button
                            type="button"
                            id={`btn-pstatus-vangp-${student.id}`}
                            onClick={() => handleUpdatePeriodStatus(student.id, selectedPeriodNum, 'Vang_P')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              singlePStatus === 'Vang_P'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                            }`}
                          >
                            P Có phép
                          </button>

                          <button
                            type="button"
                            id={`btn-pstatus-vangkp-${student.id}`}
                            onClick={() => handleUpdatePeriodStatus(student.id, selectedPeriodNum, 'Vang_KP')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              singlePStatus === 'Vang_KP'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                            }`}
                          >
                            KP Vắng không phép
                          </button>

                          <button
                            type="button"
                            id={`btn-pstatus-dimuon-${student.id}`}
                            onClick={() => handleUpdatePeriodStatus(student.id, selectedPeriodNum, 'Di_Muon')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              singlePStatus === 'Di_Muon'
                                ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                            }`}
                          >
                            ⏰ Đi muộn
                          </button>

                          <button
                            type="button"
                            id={`btn-pstatus-nghiom-${student.id}`}
                            onClick={() => handleUpdatePeriodStatus(student.id, selectedPeriodNum, 'Nghi_Om')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              singlePStatus === 'Nghi_Om'
                                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50'
                            }`}
                          >
                            🏥 Nghỉ ốm
                          </button>
                        </div>
                      </td>
                    )}

                    {/* ALL PERIODS MATRIX MODE */}
                    {viewMode === 'all_periods' && (
                      <>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pNum) => {
                          const pSt = currentPeriods[pNum] || 'Co_Mat';
                          return (
                            <td key={pNum} className="py-2 px-1 text-center border-r border-slate-100">
                              <select
                                value={pSt}
                                onChange={(e) =>
                                  handleUpdatePeriodStatus(student.id, pNum, e.target.value as AttendanceStatus)
                                }
                                className={`text-[11px] font-extrabold rounded-md px-1 py-1 border focus:outline-none cursor-pointer ${
                                  pSt === 'Co_Mat'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : pSt === 'Vang_KP'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : pSt === 'Vang_P'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-orange-100 text-orange-900 border-orange-300'
                                }`}
                              >
                                <option value="Co_Mat">✓</option>
                                <option value="Vang_P">P</option>
                                <option value="Vang_KP">KP</option>
                                <option value="Di_Muon">M</option>
                                <option value="Nghi_Om">Ốm</option>
                              </select>
                            </td>
                          );
                        })}
                      </>
                    )}

                    {/* OVERALL DAY/SESSION MODE */}
                    {viewMode === 'overall' && (
                      <td className="py-3 px-4 border-r border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateOverallStatus(student.id, 'Co_Mat')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              currentStatus === 'Co_Mat'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Có mặt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOverallStatus(student.id, 'Vang_P')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              currentStatus === 'Vang_P'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Có phép
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOverallStatus(student.id, 'Vang_KP')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              currentStatus === 'Vang_KP'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Không phép
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOverallStatus(student.id, 'Di_Muon')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                              currentStatus === 'Di_Muon'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Đi muộn
                          </button>
                        </div>
                      </td>
                    )}

                    {/* Note Input */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <input
                        type="text"
                        placeholder="Thêm lý do nghỉ/ghi chú..."
                        value={rec.note || ''}
                        onChange={(e) => handleUpdateNote(student.id, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Send Zalo Notification Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        id={`btn-notify-student-${student.id}`}
                        onClick={() =>
                          onSendNotificationModal(
                            student,
                            (singlePStatus !== 'Co_Mat' ? singlePStatus : currentStatus) as any,
                            rec.note || `Điểm danh Tiết ${selectedPeriodNum} (${selectedSubject})`
                          )
                        }
                        className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center cursor-pointer ${
                          singlePStatus !== 'Co_Mat' || currentStatus !== 'Co_Mat'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                        title="Gửi Zalo tới phụ huynh"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-slate-500 text-sm">
                    Không tìm thấy học sinh phù hợp với bộ lọc!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar: Summary & Save */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Sĩ số lớp: <strong className="text-slate-900">{filteredStudents.length}</strong> học sinh |
            Vắng/Muộn Tiết {selectedPeriodNum} ({selectedSubject}):{' '}
            <strong className="text-rose-600 font-bold">{absentInSelectedPeriod.length}</strong> học sinh
          </div>

          <button
            type="button"
            id="btn-save-attendance-bottom"
            onClick={handleSaveAll}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Xác nhận & Lưu bảng điểm danh</span>
          </button>
        </div>
      </div>

      {/* Modal View & Manage Timetable */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-8">
            <TimetableManagementView
              classes={[{ id: 'c1', name: selectedClass, grade: 'Khối' }]}
              selectedClass={selectedClass}
              onSelectClass={() => {}}
              onClose={() => setIsTimetableModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
