import React from 'react';
import { School, Calendar, UserCheck, Bell, Menu, PlusCircle, CheckCircle2, Mail, LogIn, User } from 'lucide-react';
import { ClassInfo, TeacherAccount } from '../types';

interface HeaderProps {
  classes: ClassInfo[];
  selectedClass: string;
  onSelectClass: (className: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  pendingLeavesCount: number;
  currentTeacher: TeacherAccount | null;
  onOpenGmailAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  classes,
  selectedClass,
  onSelectClass,
  selectedDate,
  onSelectDate,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  pendingLeavesCount,
  currentTeacher,
  onOpenGmailAuth,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-xs h-16">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side: Menu Toggle & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors border border-slate-200 shadow-xs cursor-pointer"
            aria-label="Toggle Menu"
            title="Mở Menu Chức Năng Hệ thống Quản lý & Điểm danh"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="flex items-center space-x-3">
            <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight">
              Hệ thống quản lý và điểm danh học sinh Trường THPT Tuệ Tĩnh
            </h2>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Class dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-2">Lớp:</span>
            <select
              id="select-header-class"
              value={selectedClass}
              onChange={(e) => onSelectClass(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white text-slate-900 font-bold">
                Tất cả các lớp (Khối 10, 11, 12)
              </option>
              <optgroup label="Khối 10 (10A - 10I)" className="bg-slate-100 font-bold text-blue-900">
                {classes.filter((c) => c.grade === 'Khối 10' || c.name.startsWith('10')).map((c) => (
                  <option key={c.id} value={c.name} className="bg-white text-slate-800 font-normal">
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Khối 11 (11A - 11I)" className="bg-slate-100 font-bold text-blue-900">
                {classes.filter((c) => c.grade === 'Khối 11' || c.name.startsWith('11')).map((c) => (
                  <option key={c.id} value={c.name} className="bg-white text-slate-800 font-normal">
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Khối 12 (12A - 12I)" className="bg-slate-100 font-bold text-blue-900">
                {classes.filter((c) => c.grade === 'Khối 12' || c.name.startsWith('12')).map((c) => (
                  <option key={c.id} value={c.name} className="bg-white text-slate-800 font-normal">
                    Lớp {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-2" />
            <input
              id="input-header-date"
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs cursor-pointer"
            />
          </div>

          {/* Action Button: Quick Attendance */}
          <button
            id="btn-header-quick-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Điểm danh</span>
          </button>

          {/* Teacher Gmail Account Card / Login trigger */}
          <button
            id="btn-header-gmail-auth"
            onClick={onOpenGmailAuth}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-all"
            title="Quản lý tài khoản Gmail Giáo viên"
          >
            {currentTeacher ? (
              <div className="flex items-center space-x-2">
                <img
                  src={currentTeacher.avatar}
                  alt={currentTeacher.name}
                  className="w-6 h-6 rounded-full border border-blue-400"
                />
                <div className="text-left leading-tight">
                  <p className="font-bold text-slate-900 text-[11px] truncate max-w-[120px]">
                    {currentTeacher.name}
                  </p>
                  <p className="text-[10px] text-blue-600 font-medium truncate max-w-[120px]">
                    {currentTeacher.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-blue-600 font-bold">
                <Mail className="w-4 h-4 text-red-500" />
                <span>Đăng nhập Gmail</span>
              </div>
            )}
          </button>

          {/* Quick Leave Badge */}
          <button
            id="btn-header-leaves"
            onClick={() => setActiveTab('leaves')}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title="Đơn xin nghỉ phép"
          >
            <Bell className="w-4 h-4" />
            {pendingLeavesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

