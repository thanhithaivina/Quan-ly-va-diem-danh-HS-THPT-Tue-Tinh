import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  FileSpreadsheet,
  BarChart3,
  MessageSquareText,
  Settings,
  X,
  PlusCircle,
  Calendar,
  School,
  BookOpen
} from 'lucide-react';
import { ClassInfo } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  pendingLeavesCount: number;
  classes: ClassInfo[];
  selectedClass: string;
  onSelectClass: (cName: string) => void;
  selectedDate: string;
  onSelectDate: (d: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  pendingLeavesCount,
  classes,
  selectedClass,
  onSelectClass,
  selectedDate,
  onSelectDate
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Điểm danh học sinh', icon: ClipboardCheck },
    { id: 'timetable', label: 'Thời khóa biểu & Lịch dạy', icon: BookOpen },
    { id: 'students', label: 'Danh sách học sinh (A-Z)', icon: Users },
    { id: 'leaves', label: 'Đơn xin nghỉ phép', icon: FileSpreadsheet, badge: pendingLeavesCount },
    { id: 'reports', label: 'Báo cáo & Xuất File', icon: BarChart3 },
    { id: 'notifications', label: 'Thông báo Zalo / SMS', icon: MessageSquareText },
    { id: 'settings', label: 'Cấu hình hệ thống', icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Backdrop for all screen sizes */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-white leading-tight">
                <span className="text-blue-400">Hệ thống Quản lý</span> <span className="text-white">& Điểm danh</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-medium tracking-tight">
                Trường THPT Tuệ Tĩnh
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 justify-between py-4 overflow-y-auto">
          {/* Mobile Class & Date Selectors */}
          <div className="md:hidden px-4 mb-4 space-y-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 mx-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Chọn Lớp học:</label>
              <select
                id="select-sidebar-mobile-class"
                value={selectedClass}
                onChange={(e) => onSelectClass(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
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
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Chọn Ngày điểm danh:</label>
              <input
                id="input-sidebar-mobile-date"
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            <div className="px-5 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chức năng chính
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 border-r-4 border-blue-500 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Teacher Profile Card Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 mt-4 mx-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                BM
              </div>
              <div className="text-xs truncate">
                <p className="font-bold text-white truncate">
                  {localStorage.getItem('app_subject_teacher_name') || 'Thầy Nguyễn Văn Thắng'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {localStorage.getItem('app_subject_teacher_subject') || 'Giáo viên bộ môn'} • Lớp {selectedClass}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
