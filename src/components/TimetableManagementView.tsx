import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Download,
  Save,
  UserCheck,
  School,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Info,
  CalendarDays,
  X,
  Plus
} from 'lucide-react';
import { ClassInfo } from '../types';
import {
  WeeklyClassSchedule,
  DayOfWeek,
  DAY_KEYS,
  DAY_NAMES,
  SUBJECT_LIST,
  PERIOD_TIMES,
  getClassTimetable,
  saveClassTimetable,
  downloadSampleTimetableCSV,
  importTimetableFromText,
  getScheduleByTeacher,
  loadAllTimetables,
  saveAllTimetables,
} from '../utils/timetable';

interface TimetableManagementViewProps {
  classes: ClassInfo[];
  selectedClass: string;
  onSelectClass: (cName: string) => void;
  onClose?: () => void;
}

export const TimetableManagementView: React.FC<TimetableManagementViewProps> = ({
  classes,
  selectedClass: initialClass,
  onSelectClass,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'by_class' | 'by_teacher' | 'import_export'>('by_class');
  const [currentClass, setCurrentClass] = useState<string>(initialClass === 'ALL' ? '12A1' : initialClass);

  // Editable Schedule for current class
  const [classSchedule, setClassSchedule] = useState<WeeklyClassSchedule>(() =>
    getClassTimetable(currentClass === 'ALL' ? '12A1' : currentClass)
  );

  // Teacher Schedule state
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('GV Nguyễn Văn A');
  const [customTeacherSearch, setCustomTeacherSearch] = useState<string>('');

  // Cell Edit Modal state
  const [editingCell, setEditingCell] = useState<{ dayKey: DayOfWeek; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState<string>('Toán Học');
  const [editTeacher, setEditTeacher] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');

  // File Upload state
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync classSchedule when currentClass changes
  useEffect(() => {
    const cName = currentClass === 'ALL' ? '12A1' : currentClass;
    setClassSchedule(getClassTimetable(cName));
  }, [currentClass]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleClassChange = (newClass: string) => {
    setCurrentClass(newClass);
    if (onSelectClass) {
      onSelectClass(newClass);
    }
  };

  // Open Cell Editor
  const handleOpenEditCell = (dayKey: DayOfWeek, period: number) => {
    const currentDetail = classSchedule[dayKey]?.[period] || { subject: 'Toán Học', teacher: '', room: '' };
    setEditingCell({ dayKey, period });
    setEditSubject(currentDetail.subject || 'Toán Học');
    setEditTeacher(currentDetail.teacher || '');
    setEditRoom(currentDetail.room || '');
  };

  // Save Cell Edit
  const handleSaveCell = () => {
    if (!editingCell) return;
    const { dayKey, period } = editingCell;

    const updated: WeeklyClassSchedule = {
      ...classSchedule,
      [dayKey]: {
        ...(classSchedule[dayKey] || {}),
        [period]: {
          subject: editSubject,
          teacher: editTeacher,
          room: editRoom,
        },
      },
    };

    setClassSchedule(updated);
    saveClassTimetable(currentClass, updated);
    setEditingCell(null);
    showToast(`Đã cập nhật Tiết ${period} (${DAY_NAMES[dayKey]}) môn ${editSubject}`);
  };

  // Save full schedule
  const handleSaveFullSchedule = () => {
    saveClassTimetable(currentClass, classSchedule);
    showToast(`Đã lưu toàn bộ Thời khóa biểu lớp ${currentClass} thành công!`);
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = importTimetableFromText(content);
      if (res.success) {
        setUploadStatus({
          type: 'success',
          message: `Nhập file thành công! Đã cập nhật ${res.count} tiết học cho các lớp: ${res.classes.join(', ')}.`,
        });
        // Refresh view
        setClassSchedule(getClassTimetable(currentClass));
        showToast('Đã import thời khóa biểu mới!');
      } else {
        setUploadStatus({
          type: 'error',
          message: `Lỗi import file: ${res.error || 'Định dạng không hợp lệ'}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // List of all unique teachers found in current timetables
  const allTimetablesData = loadAllTimetables();
  const knownTeachersSet = new Set<string>([
    'GV Nguyễn Văn A',
    'Cô Trần Thị B',
    'Cô Hoàng Minh C',
    'Thầy Phạm Văn D',
    'Cô Lê Thị E',
    'Thầy Vũ Văn F',
    'Cô Đặng Thị G',
    'Thầy Bùi Văn H',
    'Thầy Ngô Văn I',
    'Thầy Dương Văn K',
  ]);

  Object.values(allTimetablesData).forEach((sched) => {
    DAY_KEYS.forEach((dk) => {
      if (sched[dk]) {
        for (let p = 1; p <= 10; p++) {
          if (sched[dk][p]?.teacher) {
            knownTeachersSet.add(sched[dk][p].teacher!.trim());
          }
        }
      }
    });
  });

  const teacherList = Array.from(knownTeachersSet).sort();

  // Teacher Schedule Query Result
  const activeTeacherSearch = customTeacherSearch || selectedTeacherName;
  const teacherScheduleList = getScheduleByTeacher(
    activeTeacherSearch,
    classes.map((c) => c.name)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Quản Lý & Nhập Thời Khóa Biểu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập TKB theo file mẫu CSV/Excel, chỉnh sửa thủ công từng tiết hoặc tra cứu lịch dạy giáo viên
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Quay lại điểm danh
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold space-x-1">
            <button
              type="button"
              id="btn-tab-by-class"
              onClick={() => setActiveTab('by_class')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'by_class'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Thời Khóa Biểu Theo Lớp</span>
            </button>

            <button
              type="button"
              id="btn-tab-by-teacher"
              onClick={() => setActiveTab('by_teacher')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'by_teacher'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Lịch Dạy Theo Giáo Viên</span>
            </button>

            <button
              type="button"
              id="btn-tab-import-export"
              onClick={() => setActiveTab('import_export')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'import_export'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import File Mẫu (CSV / Excel)</span>
            </button>
          </div>

          {/* Download Sample Button */}
          <button
            type="button"
            id="btn-download-sample-csv-top"
            onClick={downloadSampleTimetableCSV}
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tải File Mẫu (.CSV)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EDIT TIMETABLE BY CLASS */}
      {activeTab === 'by_class' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          {/* Class selector & Save Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Chọn lớp học cần sửa:</span>
              <select
                id="select-timetable-class"
                value={currentClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="bg-white border border-slate-300 font-extrabold text-blue-900 text-sm px-3 py-1.5 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="btn-save-full-class-timetable"
              onClick={handleSaveFullSchedule}
              className="flex items-center justify-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Toàn Bộ TKB Lớp {currentClass}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Bấm trực tiếp vào từng ô tiết học để sửa môn học, tên giáo viên giảng dạy và phòng học tương ứng.
            </span>
          </p>

          {/* Weekly Timetable Grid Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase text-[11px]">
                  <th className="py-3 px-3 border-r border-slate-700 text-center w-20">Tiết / Giờ</th>
                  {DAY_KEYS.map((dayKey) => (
                    <th key={dayKey} className="py-3 px-3 border-r border-slate-700 min-w-[140px]">
                      {DAY_NAMES[dayKey]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((periodNum) => {
                  const isMorning = periodNum <= 5;

                  return (
                    <tr
                      key={periodNum}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        periodNum === 6 ? 'border-t-2 border-slate-300 bg-slate-50/60' : ''
                      }`}
                    >
                      {/* Period Header */}
                      <td className="py-3 px-2 text-center bg-slate-50 border-r border-slate-200">
                        <div className="font-black text-slate-900 text-sm">T{periodNum}</div>
                        <div className="text-[9px] text-slate-500 font-medium">{PERIOD_TIMES[periodNum]}</div>
                        <span className={`text-[8px] font-bold px-1 rounded ${
                          isMorning ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {isMorning ? 'Sáng' : 'Chiều'}
                        </span>
                      </td>

                      {/* Days Monday to Saturday */}
                      {DAY_KEYS.map((dayKey) => {
                        const detail = classSchedule[dayKey]?.[periodNum] || {
                          subject: 'Toán Học',
                          teacher: '',
                          room: '',
                        };

                        return (
                          <td
                            key={dayKey}
                            onClick={() => handleOpenEditCell(dayKey, periodNum)}
                            className="py-2.5 px-3 border-r border-slate-200 cursor-pointer hover:bg-blue-100/50 transition-colors group relative"
                            title="Bấm để chỉnh sửa tiết này"
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-700 text-xs">
                                {detail.subject}
                              </span>
                              <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {detail.teacher && (
                              <p className="text-[11px] text-blue-700 font-semibold mt-0.5 truncate">
                                👨‍🏫 {detail.teacher}
                              </p>
                            )}

                            {detail.room && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                🏫 {detail.room}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER SCHEDULE VIEW & SEARCH */}
      {activeTab === 'by_teacher' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-blue-950 text-base flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Tra Cứu & Tự Nhập Lịch Dạy Của Giáo Viên</span>
              </h3>
              <p className="text-xs text-blue-800">
                Chọn danh sách giáo viên hoặc nhập tên giáo viên để xem toàn bộ tiết phân công dạy theo tuần.
              </p>
            </div>

            {/* Teacher Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 bg-white border border-blue-300 rounded-xl px-3 py-1.5 shadow-xs">
                <span className="text-xs font-bold text-slate-700">Chọn GV:</span>
                <select
                  id="select-teacher-schedule"
                  value={selectedTeacherName}
                  onChange={(e) => {
                    setSelectedTeacherName(e.target.value);
                    setCustomTeacherSearch('');
                  }}
                  className="bg-transparent font-extrabold text-blue-900 text-xs focus:outline-none cursor-pointer"
                >
                  {teacherList.map((tName) => (
                    <option key={tName} value={tName}>
                      {tName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Hoặc gõ tên GV khác..."
                  value={customTeacherSearch}
                  onChange={(e) => setCustomTeacherSearch(e.target.value)}
                  className="pl-3 pr-3 py-1.5 bg-white border border-blue-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Teacher Weekly Schedule Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                <span>Lịch Giảng Dạy Tuần:</span>
                <span className="text-blue-700 bg-blue-100 px-3 py-0.5 rounded-lg text-xs">
                  {activeTeacherSearch}
                </span>
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                Tổng số tiết phân công: <strong>{teacherScheduleList.length} tiết / tuần</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase text-[11px]">
                    <th className="py-3 px-3 border-r border-slate-700 text-center w-20">Tiết</th>
                    {DAY_KEYS.map((dayKey) => (
                      <th key={dayKey} className="py-3 px-3 border-r border-slate-700 min-w-[140px]">
                        {DAY_NAMES[dayKey]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((periodNum) => {
                    return (
                      <tr key={periodNum} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-2 text-center bg-slate-50 border-r border-slate-200 font-bold">
                          T{periodNum}
                          <div className="text-[9px] text-slate-400 font-normal">{PERIOD_TIMES[periodNum]}</div>
                        </td>

                        {DAY_KEYS.map((dayKey) => {
                          const teachingPeriods = teacherScheduleList.filter(
                            (item) => item.dayKey === dayKey && item.period === periodNum
                          );

                          return (
                            <td key={dayKey} className="py-2.5 px-3 border-r border-slate-200">
                              {teachingPeriods.length > 0 ? (
                                teachingPeriods.map((item, i) => (
                                  <div
                                    key={i}
                                    className="bg-blue-100/80 border border-blue-300 rounded-xl p-2 space-y-0.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-blue-900 text-xs">
                                        Lớp {item.className}
                                      </span>
                                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                                        {item.subject}
                                      </span>
                                    </div>
                                    {item.room && (
                                      <p className="text-[10px] text-blue-800 font-medium">🏫 {item.room}</p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-300 text-[10px] font-medium">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT / EXPORT FILE MAU */}
      {activeTab === 'import_export' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Download Sample File */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Bước 1: Tải File Mẫu Thời Khóa Biểu</h4>
                  <p className="text-xs text-slate-500">
                    Sử dụng file mẫu .CSV định dạng tiêu chuẩn gồm các cột Lớp, Thứ, Tiết, Môn Học, Giáo Viên
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Cấu trúc các cột file mẫu:</p>
                <p className="text-blue-700 font-semibold">Lop,Thu,Tiet,MonHoc,GiaoVien,PhongHoc</p>
                <p className="text-slate-500">VD: 12A1,Thứ Hai,1,Toán Học,GV Nguyễn Văn A,P.101</p>
              </div>

              <button
                type="button"
                id="btn-download-template-csv-tab"
                onClick={downloadSampleTimetableCSV}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải File Mẫu (.CSV) Ngay</span>
              </button>
            </div>

            {/* Step 2: Upload CSV / Excel / JSON File */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Bước 2: Tải Lên File Đã Điền TKB</h4>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ định dạng file .csv, .txt hoặc .json chứa thông tin thời khóa biểu
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-2xl p-6 text-center space-y-2 transition-colors">
                <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  Kéo thả file vào đây hoặc bấm để chọn file
                </p>
                <input
                  type="file"
                  id="input-timetable-file-upload"
                  accept=".csv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="input-timetable-file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  Chọn File Từ Máy Tính
                </label>
              </div>

              {uploadStatus.type && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2.5 ${
                    uploadStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{uploadStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SINGLE CELL PERIOD */}
      {editingCell && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  T{editingCell.period}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Sửa Tiết {editingCell.period} - {DAY_NAMES[editingCell.dayKey]}
                  </h3>
                  <p className="text-xs text-slate-500">Lớp {currentClass}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học:</label>
                <select
                  id="select-edit-cell-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUBJECT_LIST.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Giáo Viên Giảng Dạy:</label>
                <input
                  type="text"
                  id="input-edit-cell-teacher"
                  placeholder="Ví dụ: GV Nguyễn Văn A, Cô Trần Thị B..."
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Classroom / Room */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phòng Học / Phòng Chức Năng:</label>
                <input
                  type="text"
                  id="input-edit-cell-room"
                  placeholder="Ví dụ: P.101, Phòng Lab, Sân Tập..."
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                id="btn-save-cell-changes"
                onClick={handleSaveCell}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
