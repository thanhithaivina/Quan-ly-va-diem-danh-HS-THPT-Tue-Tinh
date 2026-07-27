import React, { useState } from 'react';
import { Settings, RefreshCw, Download, Upload, Shield, Save, CheckCircle2, School, BookOpen } from 'lucide-react';
import { ClassInfo } from '../types';

interface SettingsViewProps {
  classes: ClassInfo[];
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ classes, onResetData }) => {
  const [teacherName, setTeacherName] = useState(() => {
    return localStorage.getItem('app_subject_teacher_name') || 'Thầy Nguyễn Văn Thắng';
  });
  const [subjectName, setSubjectName] = useState(() => {
    return localStorage.getItem('app_subject_teacher_subject') || 'Toán Học';
  });
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('app_subject_teacher_name', teacherName);
    localStorage.setItem('app_subject_teacher_subject', subjectName);
    setToastMessage('Đã lưu thông tin giáo viên bộ môn thành công!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBackupJSON = () => {
    const backupData = {
      students: localStorage.getItem('app_students_v1'),
      classes: localStorage.getItem('app_classes_v1'),
      attendance: localStorage.getItem('app_attendance_v1'),
      leaves: localStorage.getItem('app_leaves_v1'),
      logs: localStorage.getItem('app_notif_logs_v1'),
      timetables: localStorage.getItem('app_timetable_schedules_v1'),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_Diem_Danh_Hoc_Sinh_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Cấu Hình Lớp Học & Hệ Thống</h2>
        <p className="text-xs text-slate-500 mt-0.5">Thiết lập thông tin giáo viên bộ môn đang dạy và quản lý dữ liệu sao lưu</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>Thông Tin Giáo Viên Bộ Môn Đang Dạy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Họ tên Giáo viên bộ môn:</label>
            <input
              type="text"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Ví dụ: Thầy Nguyễn Văn Thắng..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Môn học giảng dạy:</label>
            <input
              type="text"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ví dụ: Toán Học, Vật Lý, Tiếng Anh..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Năm học:</label>
            <input
              type="text"
              required
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            id="btn-save-settings"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Cập nhật cấu hình</span>
          </button>
        </div>
      </form>

      {/* Backup & Restore */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          Sao Lưu & Khôi Phục Dữ Liệu
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            id="btn-backup-json"
            onClick={handleBackupJSON}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Tải file Sao lưu (.json)</span>
          </button>

          <button
            type="button"
            id="btn-reset-data-settings"
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu ban đầu? Tất cả dữ liệu hiện tại sẽ được khởi tạo lại.')) {
                onResetData();
              }
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-rose-600" />
            <span>Khôi phục dữ liệu mẫu ban đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
