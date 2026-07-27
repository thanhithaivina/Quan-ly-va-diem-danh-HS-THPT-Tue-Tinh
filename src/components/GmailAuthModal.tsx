import React, { useState } from 'react';
import { Mail, ShieldCheck, UserCheck, ArrowRight, LogIn, Lock, CheckCircle2 } from 'lucide-react';
import { TeacherAccount } from '../types';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: TeacherAccount | null;
  onLogin: (account: TeacherAccount) => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onLogin,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customSubject, setCustomSubject] = useState('Môn Toán');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.includes('@gmail.com') && !customEmail.includes('@')) {
      alert('Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: giaovien@gmail.com)!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLogin({
        email: customEmail.trim(),
        name: customName.trim() || `Giáo viên (${customEmail.split('@')[0]})`,
        school: 'Trường THPT Chuyên 2026',
        role: 'Giáo viên Bộ Môn / Quản lý',
        subject: customSubject,
        assignedClasses: ['10A', '10B', '11A', '12A'],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${customEmail}`,
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
        {/* Header Badge */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-2">
            <Mail className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Đăng Nhập Tài Khoản Gmail</h3>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi Gmail là một tài khoản riêng quản lý dữ liệu học sinh & điểm danh
          </p>
        </div>

        {/* Current logged in account if any */}
        {currentAccount && (
          <div className="my-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={currentAccount.avatar}
                alt={currentAccount.name}
                className="w-10 h-10 rounded-full border border-emerald-300"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{currentAccount.name}</p>
                <p className="text-[11px] text-emerald-800 font-mono">{currentAccount.email}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
              Đang đăng nhập
            </span>
          </div>
        )}

        {/* Manual Gmail Input */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nhập địa chỉ Gmail để đăng nhập:
          </p>
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Địa chỉ Gmail:
              </label>
              <input
                type="email"
                required
                placeholder="giaovien.bomon@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Họ tên:</label>
                <input
                  type="text"
                  placeholder="Cô Lê Thanh Hà"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Môn giảng dạy:
                </label>
                <select
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Môn Toán">Môn Toán</option>
                  <option value="Môn Ngữ Văn">Môn Ngữ Văn</option>
                  <option value="Môn Tiếng Anh">Môn Tiếng Anh</option>
                  <option value="Môn Vật Lý">Môn Vật Lý</option>
                  <option value="Môn Hóa Học">Môn Hóa Học</option>
                  <option value="Môn Lịch Sử">Môn Lịch Sử</option>
                  <option value="Môn Tin Học">Môn Tin Học</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="submit"
                id="btn-submit-custom-gmail"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Gmail'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
