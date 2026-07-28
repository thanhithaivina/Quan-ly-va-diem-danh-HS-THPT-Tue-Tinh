import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { StudentsView } from './components/StudentsView';
import { LeavesView } from './components/LeavesView';
import { ReportsView } from './components/ReportsView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { TimetableManagementView } from './components/TimetableManagementView';
import { SendNotificationModal } from './components/SendNotificationModal';
import { GmailAuthModal } from './components/GmailAuthModal';

import {
  Student,
  ClassInfo,
  AttendanceRecord,
  AbsenceLeave,
  NotificationLog,
  NotificationChannelConfig,
  NotificationTemplate,
  TeacherAccount
} from './types';

import {
  DEFAULT_TEACHER_ACCOUNT,
  updateRegisteredAccount,
  getStoredStudents,
  saveStoredStudents,
  getStoredClasses,
  saveStoredClasses,
  getStoredAttendance,
  saveStoredAttendance,
  getStoredLeaves,
  saveStoredLeaves,
  getStoredNotifLogs,
  saveStoredNotifLogs,
  getStoredConfigs,
  saveStoredConfigs,
  getStoredTemplates,
  saveStoredTemplates
} from './utils/storage';

export default function App() {
  // Current Active Teacher Account
  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('app_current_teacher_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_TEACHER_ACCOUNT;
  });

  // Load account-specific isolated workspace data
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents(currentTeacher?.email));
  const [classes, setClasses] = useState<ClassInfo[]>(() => getStoredClasses(currentTeacher?.email));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getStoredAttendance(currentTeacher?.email));
  const [leaves, setLeaves] = useState<AbsenceLeave[]>(() => getStoredLeaves(currentTeacher?.email));
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>(() => getStoredNotifLogs(currentTeacher?.email));
  const [configs, setConfigs] = useState<NotificationChannelConfig[]>(() => getStoredConfigs(currentTeacher?.email));
  const [templates, setTemplates] = useState<NotificationTemplate[]>(() => getStoredTemplates(currentTeacher?.email));

  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedClass, setSelectedClass] = useState<string>('10A');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Send Notification Modal state
  const [sendModalData, setSendModalData] = useState<{
    student: Student;
    statusType: 'Vang_KP' | 'Vang_P' | 'Di_Muon' | 'Co_Mat';
    defaultReason?: string;
  } | null>(null);

  // Reload data whenever active teacher changes
  const loadTeacherWorkspace = (teacherEmail?: string) => {
    setStudents(getStoredStudents(teacherEmail));
    setClasses(getStoredClasses(teacherEmail));
    setAttendanceRecords(getStoredAttendance(teacherEmail));
    setLeaves(getStoredLeaves(teacherEmail));
    setNotifLogs(getStoredNotifLogs(teacherEmail));
    setConfigs(getStoredConfigs(teacherEmail));
    setTemplates(getStoredTemplates(teacherEmail));
  };

  const handleLoginTeacher = (acc: TeacherAccount) => {
    setCurrentTeacher(acc);
    localStorage.setItem('app_current_teacher_account', JSON.stringify(acc));
    loadTeacherWorkspace(acc.email);
  };

  const handleLogoutTeacher = () => {
    setCurrentTeacher(null);
    localStorage.removeItem('app_current_teacher_account');
    setIsGmailModalOpen(true);
  };

  const handleUpdateTeacherAccount = (updatedAcc: TeacherAccount) => {
    const saved = updateRegisteredAccount(updatedAcc);
    setCurrentTeacher(saved);
  };

  // Save current teacher account to local storage
  useEffect(() => {
    if (currentTeacher) {
      localStorage.setItem('app_current_teacher_account', JSON.stringify(currentTeacher));
    }
  }, [currentTeacher]);

  // Persist state updates to LocalStorage scoped by teacher email
  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredStudents(students, currentTeacher.email);
    }
  }, [students, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredClasses(classes, currentTeacher.email);
    }
  }, [classes, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredAttendance(attendanceRecords, currentTeacher.email);
    }
  }, [attendanceRecords, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredLeaves(leaves, currentTeacher.email);
    }
  }, [leaves, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredNotifLogs(notifLogs, currentTeacher.email);
    }
  }, [notifLogs, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredConfigs(configs, currentTeacher.email);
    }
  }, [configs, currentTeacher?.email]);

  useEffect(() => {
    if (currentTeacher?.email) {
      saveStoredTemplates(templates, currentTeacher.email);
    }
  }, [templates, currentTeacher?.email]);

  // Restore state from imported backup JSON object
  const handleRestoreData = (backupObj: any): boolean => {
    try {
      const parseOrReturn = (val: any) => {
        if (!val) return null;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return null;
          }
        }
        return val;
      };

      const emailToUse = currentTeacher?.email;

      const restoredStudents = parseOrReturn(backupObj.students);
      const restoredClasses = parseOrReturn(backupObj.classes);
      const restoredAttendance = parseOrReturn(backupObj.attendance);
      const restoredLeaves = parseOrReturn(backupObj.leaves);
      const restoredLogs = parseOrReturn(backupObj.logs || backupObj.notifLogs);
      const restoredConfigs = parseOrReturn(backupObj.configs);
      const restoredTemplates = parseOrReturn(backupObj.templates);
      const restoredTeacherAccount = parseOrReturn(backupObj.teacherAccount);

      if (Array.isArray(restoredStudents)) {
        setStudents(restoredStudents);
        saveStoredStudents(restoredStudents, emailToUse);
      }
      if (Array.isArray(restoredClasses)) {
        setClasses(restoredClasses);
        saveStoredClasses(restoredClasses, emailToUse);
      }
      if (Array.isArray(restoredAttendance)) {
        setAttendanceRecords(restoredAttendance);
        saveStoredAttendance(restoredAttendance, emailToUse);
      }
      if (Array.isArray(restoredLeaves)) {
        setLeaves(restoredLeaves);
        saveStoredLeaves(restoredLeaves, emailToUse);
      }
      if (Array.isArray(restoredLogs)) {
        setNotifLogs(restoredLogs);
        saveStoredNotifLogs(restoredLogs, emailToUse);
      }
      if (Array.isArray(restoredConfigs)) {
        setConfigs(restoredConfigs);
        saveStoredConfigs(restoredConfigs, emailToUse);
      }
      if (Array.isArray(restoredTemplates)) {
        setTemplates(restoredTemplates);
        saveStoredTemplates(restoredTemplates, emailToUse);
      }
      if (restoredTeacherAccount) {
        handleUpdateTeacherAccount(restoredTeacherAccount);
      }

      return true;
    } catch (err) {
      console.error('Lỗi khi phục hồi dữ liệu backup:', err);
      return false;
    }
  };

  // Student CRUD
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteStudents = (ids: string[]) => {
    const idSet = new Set(ids);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id)));
  };

  const handleImportStudents = (newStudents: Student[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
  };

  // Attendance Save handler
  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const map = new Map<string, AttendanceRecord>();
      prev.forEach((r) => map.set(`${r.studentId}_${r.date}`, r));
      newRecords.forEach((r) => map.set(`${r.studentId}_${r.date}`, r));
      return Array.from(map.values());
    });
  };

  // Absence Leave Approval
  const handleApproveLeave = (leaveId: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? { ...l, status: 'Đã duyệt', approvedBy: currentTeacher?.name || 'Giáo viên' }
          : l
      )
    );
  };

  const handleRejectLeave = (leaveId: string, reason?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? { ...l, status: 'Từ chối', rejectionReason: reason, approvedBy: currentTeacher?.name || 'Giáo viên' }
          : l
      )
    );
  };

  const handleCreateLeave = (newLeave: AbsenceLeave) => {
    setLeaves((prev) => [newLeave, ...prev]);
  };

  // Notification Handler
  const handleConfirmSendNotification = (
    student: Student,
    channel: 'Zalo' | 'SMS' | 'Zalo ZNS',
    message: string
  ) => {
    const newLog: NotificationLog = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      parentPhone: student.parentPhone,
      channel,
      type: 'Vắng không phép',
      content: message,
      sentAt: new Date().toLocaleString('vi-VN'),
      status: 'Đã gửi',
    };
    setNotifLogs((prev) => [newLog, ...prev]);
  };

  const pendingLeavesCount = leaves.filter((l) => l.status === 'Chờ duyệt').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased flex flex-col">
      {/* Top Header */}
      <Header
        classes={classes}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        pendingLeavesCount={pendingLeavesCount}
        currentTeacher={currentTeacher}
        onOpenGmailAuth={() => setIsGmailModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          pendingLeavesCount={pendingLeavesCount}
          classes={classes}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentTeacher={currentTeacher}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-16 sm:pb-14">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              attendanceRecords={attendanceRecords}
              leaves={leaves}
              selectedClass={selectedClass}
              selectedDate={selectedDate}
              onNavigate={setActiveTab}
              onSendNotificationModal={(student, type) =>
                setSendModalData({ student, statusType: type })
              }
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              students={students}
              attendanceRecords={attendanceRecords}
              selectedClass={selectedClass}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSaveAttendance={handleSaveAttendance}
              onSendNotificationModal={(student, type, reason) =>
                setSendModalData({ student, statusType: type, defaultReason: reason })
              }
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableManagementView
              classes={classes}
              selectedClass={selectedClass}
              onSelectClass={setSelectedClass}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              selectedClass={selectedClass}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteStudents={handleDeleteStudents}
              onImportStudents={handleImportStudents}
            />
          )}

          {activeTab === 'leaves' && (
            <LeavesView
              leaves={leaves}
              students={students}
              selectedClass={selectedClass}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onCreateLeave={handleCreateLeave}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              attendanceRecords={attendanceRecords}
              classes={classes}
              selectedClass={selectedClass}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              logs={notifLogs}
              configs={configs}
              templates={templates}
              students={students}
              onUpdateConfigs={setConfigs}
              onUpdateTemplates={setTemplates}
              onResendNotification={(log) => {
                const std = students.find((s) => s.id === log.studentId);
                if (std) setSendModalData({ student: std, statusType: 'Vang_KP' });
              }}
              onManualSendNotification={handleConfirmSendNotification}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              classes={classes}
              currentTeacher={currentTeacher}
              onUpdateAccount={handleUpdateTeacherAccount}
              onRestoreData={handleRestoreData}
            />
          )}
        </main>
      </div>

      {/* Persistent Global Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-4 sm:px-6 text-center text-xs text-slate-700 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="font-bold text-slate-900 tracking-tight">
            Hệ thống quản lý và điểm danh học sinh Trường THPT Tuệ Tĩnh
          </p>
          <p className="text-slate-600">
            Người phát triển và triển khai: <span className="font-bold text-blue-900">Thạc sỹ Nguyễn Văn Thành - GV Tin học - Trường THPT Tuệ Tĩnh</span>
          </p>
        </div>
      </footer>

      {/* Send Notification Modal */}
      {sendModalData && (
        <SendNotificationModal
          student={sendModalData.student}
          statusType={sendModalData.statusType}
          defaultReason={sendModalData.defaultReason}
          onClose={() => setSendModalData(null)}
          onConfirmSend={handleConfirmSendNotification}
        />
      )}

      {/* Gmail / Account Auth Modal */}
      <GmailAuthModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        currentAccount={currentTeacher}
        onLogin={handleLoginTeacher}
        onLogout={handleLogoutTeacher}
      />
    </div>
  );
}
