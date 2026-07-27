import React, { useState, useRef } from 'react';
import { Settings, Download, Upload, Shield, Save, CheckCircle2, School, BookOpen, FileJson } from 'lucide-react';
import { ClassInfo } from '../types';

interface SettingsViewProps {
  classes: ClassInfo[];
  onRestoreData: (backupObj: any) => boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ classes, onRestoreData }) => {
  const [teacherName, setTeacherName] = useState(() => {
    return localStorage.getItem('app_subject_teacher_name') || 'Thầy Nguyễn Văn Thắng';
  });
  const [subjectName, setSubjectName] = useState(() => {
    return localStorage.getItem('app_subject_teacher_subject') || 'Toán Học';
  });
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('app_subject_teacher_name', teacherName);
    localStorage.setItem('app_subject_teacher_subject', subjectName);
    setToastMessage('Đã lưu thông tin giáo viên bộ môn thành công!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBackupJSON = () => {
    try {
      const parseOrRaw = (key: string) => {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      };

      const backupData = {
        appTitle: "Hệ thống quản lý và điểm danh học sinh Trường THPT Tuệ Tĩnh",
        exportDate: new Date().toISOString(),
        students: parseOrRaw('app_students_v1'),
        classes: parseOrRaw('app_classes_v1'),
        attendance: parseOrRaw('app_attendance_v1'),
        leaves: parseOrRaw('app_leaves_v1'),
        logs: parseOrRaw('app_notif_logs_v1'),
        configs: parseOrRaw('app_configs_v1'),
        templates: parseOrRaw('app_templates_v1'),
        timetables: parseOrRaw('app_timetable_schedules_v1'),
        teacherAccount: parseOrRaw('app_current_teacher_account'),
        subjectTeacherName: localStorage.getItem('app_subject_teacher_name') || '',
        subjectTeacherSubject: localStorage.getItem('app_subject_teacher_subject') || '',
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sao_Luu_THPT_Tue_Tinh_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setToastMessage('Tải xuống file sao lưu (.json) thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      alert('Không thể tải xuống tệp sao lưu. Vui lòng thử lại!');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || typeof data !== 'object') {
          alert('Tệp .json chọn không đúng định dạng!');
          return;
        }

        const hasValidKeys = data.students || data.attendance || data.classes || data.leaves || data.logs;
        if (!hasValidKeys) {
          alert('Tệp .json này không chứa dữ liệu sao lưu hợp lệ của hệ thống!');
          return;
        }

        const exportDateStr = data.exportDate
          ? new Date(data.exportDate).toLocaleString('vi-VN')
          : 'Không rõ';

        const confirmRestore = window.confirm(
          `XÁC NHẬN KHÔI PHỤC DỮ LIỆU:\n\n` +
            `Bạn có chắc chắn muốn khôi phục dữ liệu từ tệp "${file.name}"?\n` +
            `- Ngày sao lưu: ${exportDateStr}\n` +
            `- Thao tác này sẽ cập nhật lại toàn bộ Học sinh, Lớp học, Điểm danh, Đơn xin nghỉ và Nhật ký thông báo.`
        );

        if (confirmRestore) {
          const success = onRestoreData(data);
          if (success) {
            setToastMessage('Khôi phục dữ liệu từ file .json thành công!');
            setTimeout(() => setToastMessage(null), 4000);
          } else {
            alert('Có lỗi xảy ra trong quá trình khôi phục dữ liệu!');
          }
        }
      } catch {
        alert('Lỗi đọc tệp .json! Vui lòng kiểm tra lại file sao lưu.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-blue-600" />
            <span>Sao Lưu & Khôi Phục Dữ Liệu (.JSON)</span>
          </h3>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Định dạng .JSON
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Quý thầy cô có thể tải file sao lưu để lưu trữ an toàn hoặc tải tệp backup (.json) đã lưu trước đó để khôi phục toàn bộ dữ liệu danh sách học sinh, điểm danh, đơn xin nghỉ và lịch sử thông báo.
        </p>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          className="hidden"
          id="input-restore-json-file"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            id="btn-backup-json"
            onClick={handleBackupJSON}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Tải file Sao lưu (.json)</span>
          </button>

          <button
            type="button"
            id="btn-restore-json"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Khôi phục dữ liệu từ file (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
