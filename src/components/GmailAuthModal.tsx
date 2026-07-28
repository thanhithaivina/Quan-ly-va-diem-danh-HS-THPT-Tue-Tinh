import React, { useState } from 'react';
import { Mail, User, Phone, BookOpen, Calendar, Lock, LogIn, UserPlus, LogOut, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { TeacherAccount } from '../types';
import { getRegisteredAccounts, registerNewAccount, authenticateAccount } from '../utils/storage';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: TeacherAccount | null;
  onLogin: (account: TeacherAccount) => void;
  onLogout: () => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onLogin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form states for Registration
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSubject, setRegSubject] = useState('Môn Toán Học');
  const [regSchoolYear, setRegSchoolYear] = useState('2025-2026');
  const [regError, setRegError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Vui lòng nhập địa chỉ Email!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = authenticateAccount(loginEmail, loginPassword);
      setIsSubmitting(false);

      if (!res.success || !res.account) {
        setLoginError(res.error || 'Đăng nhập không thành công.');
        return;
      }

      onLogin(res.account);
      onClose();
    }, 300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regEmail.trim()) {
      setRegError('Vui lòng nhập địa chỉ Email!');
      return;
    }
    if (!regPassword.trim()) {
      setRegError('Vui lòng nhập mật khẩu tài khoản!');
      return;
    }
    if (!regName.trim()) {
      setRegError('Vui lòng nhập Họ tên giáo viên!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newAcc: TeacherAccount = {
        email: regEmail.trim(),
        password: regPassword.trim(),
        name: regName.trim(),
        phone: regPhone.trim() || '0903000111',
        subject: regSubject,
        schoolYear: regSchoolYear,
        school: 'Trường THPT Tuệ Tĩnh',
        role: 'Giáo viên Bộ Môn / Chủ Nhiệm',
        assignedClasses: ['10A', '10B', '11A'],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${regEmail.trim()}`,
      };

      const res = registerNewAccount(newAcc);
      setIsSubmitting(false);

      if (!res.success || !res.account) {
        setRegError(res.error || 'Đăng ký tài khoản không thành công.');
        return;
      }

      onLogin(res.account);
      onClose();
    }, 400);
  };

  const registeredAccounts = getRegisteredAccounts();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs mb-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Tài Khoản Giáo Viên</h3>
          <p className="text-xs text-slate-500 mt-1">
            Định danh mỗi giáo viên bằng Email & Mật khẩu riêng để bảo mật dữ liệu làm việc
          </p>
        </div>

        {/* Currently logged-in profile card */}
        {currentAccount && (
          <div className="my-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600 inline mr-1" />
                Tài khoản đang đăng nhập
              </span>
              <button
                type="button"
                id="btn-modal-logout"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn đăng xuất tài khoản "${currentAccount.name}"?`)) {
                    onLogout();
                  }
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>

            <div className="flex items-start space-x-3 pt-1">
              <img
                src={currentAccount.avatar}
                alt={currentAccount.name}
                className="w-12 h-12 rounded-2xl border border-blue-300 shadow-xs shrink-0"
              />
              <div className="space-y-0.5 text-xs text-slate-700 min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm">{currentAccount.name}</p>
                <p className="font-mono text-blue-700 font-semibold">{currentAccount.email}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1">
                  <span><strong>SĐT:</strong> {currentAccount.phone || 'Chưa cập nhật'}</span>
                  <span><strong>Môn:</strong> {currentAccount.subject || 'Môn Toán'}</span>
                  <span><strong>Năm học:</strong> {currentAccount.schoolYear || '2025-2026'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl my-4">
          <button
            type="button"
            id="tab-modal-login"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>
          <button
            type="button"
            id="tab-modal-register"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Địa chỉ Email tài khoản:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="giaovien@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Địa chỉ Email (Duy nhất):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="nguyen.van.a@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Mật khẩu đăng nhập:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Họ và tên Giáo viên:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Thầy Nguyễn Văn A"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Số điện thoại liên hệ:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Môn giảng dạy:
                </label>
                <select
                  value={regSubject}
                  onChange={(e) => setRegSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Môn Toán Học">Môn Toán Học</option>
                  <option value="Môn Ngữ Văn">Môn Ngữ Văn</option>
                  <option value="Môn Tiếng Anh">Môn Tiếng Anh</option>
                  <option value="Môn Vật Lý">Môn Vật Lý</option>
                  <option value="Môn Hóa Học">Môn Hóa Học</option>
                  <option value="Môn Sinh Học">Môn Sinh Học</option>
                  <option value="Môn Tin Học">Môn Tin Học</option>
                  <option value="Môn Lịch Sử">Môn Lịch Sử</option>
                  <option value="Môn Địa Lý">Môn Địa Lý</option>
                  <option value="Môn GDCD">Môn GDCD</option>
                  <option value="Môn Thể Dục">Môn Thể Dục</option>
                  <option value="Môn Quốc Phòng">Môn Quốc Phòng</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  Năm học:
                </label>
                <input
                  type="text"
                  required
                  placeholder="2025-2026"
                  value={regSchoolYear}
                  onChange={(e) => setRegSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                id="btn-submit-register"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang khởi tạo...' : 'Tạo Tài Khoản & Đăng Nhập'}</span>
              </button>
            </div>
          </form>
        )}

        {/* List of Registered Accounts on device */}
        {registeredAccounts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Danh sách tài khoản giáo viên đã tạo trên thiết bị:
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {registeredAccounts.map((acc) => {
                const isCurrent = currentAccount?.email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <div
                    key={acc.email}
                    onClick={() => {
                      onLogin(acc);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-300 font-bold text-blue-900'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <img src={acc.avatar} alt={acc.name} className="w-6 h-6 rounded-full border border-slate-300" />
                      <div className="truncate">
                        <span className="font-bold text-slate-900 mr-2">{acc.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">{acc.email}</span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Đang chọn
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-600 font-semibold hover:underline">
                        Chuyển tài khoản
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
