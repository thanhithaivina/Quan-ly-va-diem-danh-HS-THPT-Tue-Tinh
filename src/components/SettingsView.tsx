import React, { useState, useEffect, useRef } from 'react';
import { Settings, Download, Upload, Save, CheckCircle2, User, Mail, Phone, BookOpen, Calendar, Lock, FileJson } from 'lucide-react';
import { ClassInfo, TeacherAccount } from '../types';

interface SettingsViewProps {
  classes: ClassInfo[];
  currentTeacher: TeacherAccount | null;
  onUpdateAccount: (updated: TeacherAccount) => void;
  onRestoreData: (backupObj: any) => boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  classes,
  currentTeacher,
  onUpdateAccount,
  onRestoreData,
}) => {
  const [name, setName] = useState(currentTeacher?.name || 'Cô Nguyễn Thị Hoa');
  const [email, setEmail] = useState(currentTeacher?.email || 'nguyen.van.hoa@gmail.com');
  const [phone, setPhone] = useState(currentTeacher?.phone || '0903112233');
  const [subject, setSubject] = useState(currentTeacher?.subject || 'Môn Toán Học');
  const [schoolYear, setSchoolYear] = useState(currentTeacher?.schoolYear || '2025-2026');
  const [password, setPassword] = useState(currentTeacher?.password || '123456');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentTeacher) {
      setName(currentTeacher.name || '');
      setEmail(currentTeacher.email || '');
      setPhone(currentTeacher.phone || '');
      setSubject(currentTeacher.subject || 'Môn Toán Học');
      setSchoolYear(currentTeacher.schoolYear || '2025-2026');
      setPassword(currentTeacher.password || '');
    }
  }, [currentTeacher]);

  const handleSaveAccountProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    const updatedAccount: TeacherAccount = {
      ...currentTeacher,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      schoolYear: schoolYear.trim(),
      password: password.trim(),
    };

    onUpdateAccount(updatedAccount);
    setToastMessage('Cập nhật thông tin tài khoản đăng nhập thành công!');
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

      const emailTag = (currentTeacher?.email || 'default').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

      const backupData = {
        appTitle: "Hệ thống quản lý và điểm danh học sinh Trường THPT Tuệ Tĩnh",
        exportDate: new Date().toISOString(),
        students: parseOrRaw(`app_students_v1_${emailTag}`),
        classes: parseOrRaw(`app_classes_v1_${emailTag}`),
        attendance: parseOrRaw(`app_attendance_v1_${emailTag}`),
        leaves: parseOrRaw(`app_leaves_v1_${emailTag}`),
        logs: parseOrRaw(`app_notif_logs_v1_${emailTag}`),
        configs: parseOrRaw(`app_configs_v1_${emailTag}`),
        templates: parseOrRaw(`app_templates_v1_${emailTag}`),
        teacherAccount: currentTeacher,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sao_Luu_Tai_Khoan_${currentTeacher?.email.split('@')[0] || 'GiaoVien'}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setToastMessage('Tải xuống file sao lưu tài khoản (.json) thành công!');
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
            `- Thao tác này sẽ cập nhật lại toàn bộ Học sinh, Lớp học, Điểm danh, Đơn xin nghỉ và Nhật ký thông báo cho tài khoản hiện tại.`
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

      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-2xl font-bold text-slate-900">Thông Tin Tài Khoản & Cấu Hình Hệ Thống</h2>
        <p className="text-xs text-slate-500 mt-0.5">Quản lý định danh tài khoản giáo viên đăng nhập và lưu trữ dữ liệu cá nhân</p>
      </div>

      {/* Account Profile Settings Form */}
      <form onSubmit={handleSaveAccountProfile} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Thông Tin Tài Khoản Đăng Nhập</span>
          </h3>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Tài khoản cá nhân
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ tên Giáo viên:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cô Lê Thanh Hà..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Địa chỉ Email đăng nhập (Định danh duy nhất):
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Số điện thoại liên hệ:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Môn giảng dạy:
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Môn Toán Học, Môn Tiếng Anh..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Năm học công tác:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mật khẩu đăng nhập:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            id="btn-save-account-profile"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thông Tin Tài Khoản</span>
          </button>
        </div>
      </form>

      {/* Backup & Restore Data */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-blue-600" />
            <span>Sao Lưu & Khôi Phục Dữ Liệu Tài Khoản (.JSON)</span>
          </h3>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Dữ liệu riêng tư
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tải file (.json) chứa toàn bộ danh sách học sinh, lịch sử điểm danh, đơn xin nghỉ và lịch sử gửi tin nhắn của tài khoản <strong>{currentTeacher?.email}</strong> để lưu trữ hoặc khôi phục dữ liệu khi cần.
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
