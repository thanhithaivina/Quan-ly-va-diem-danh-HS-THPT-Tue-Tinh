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
  saveStoredTemplates,
  resetAllToDefault
} from './utils/storage';

export default function App() {
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [classes, setClasses] = useState<ClassInfo[]>(getStoredClasses);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [leaves, setLeaves] = useState<AbsenceLeave[]>(getStoredLeaves);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>(getStoredNotifLogs);
  const [configs, setConfigs] = useState<NotificationChannelConfig[]>(getStoredConfigs);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(getStoredTemplates);

  // Teacher Gmail Login state
  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('app_current_teacher_account');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      email: 'nguyen.van.hoa@gmail.com',
      name: 'Cô Nguyễn Thị Hoa',
      school: 'Trường THPT Chuyên 2026',
      role: 'Giáo viên Chủ Nhiệm 10A',
      subject: 'Môn Toán Học',
      assignedClasses: ['10A', '10B', '11A'],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    };
  });

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

  // Save current teacher account
  useEffect(() => {
    if (currentTeacher) {
      localStorage.setItem('app_current_teacher_account', JSON.stringify(currentTeacher));
    }
  }, [currentTeacher]);

  // Persist state updates to LocalStorage
  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  useEffect(() => {
    saveStoredClasses(classes);
  }, [classes]);

  useEffect(() => {
    saveStoredAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    saveStoredLeaves(leaves);
  }, [leaves]);

  useEffect(() => {
    saveStoredNotifLogs(notifLogs);
  }, [notifLogs]);

  useEffect(() => {
    saveStoredConfigs(configs);
  }, [configs]);

  useEffect(() => {
    saveStoredTemplates(templates);
  }, [templates]);

  // Reset to sample data
  const handleResetData = () => {
    const res = resetAllToDefault();
    setStudents(res.students);
    setClasses(res.classes);
    setAttendanceRecords(res.attendance);
    setLeaves(res.leaves);
    setNotifLogs(res.notifLogs);
    alert('Đã khôi phục dữ liệu học sinh & điểm danh mẫu thành công!');
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

  const handleImportStudents = (imported: Student[], overwriteClass?: string) => {
    setStudents((prev) => {
      if (overwriteClass) {
        const remaining = prev.filter((s) => s.className !== overwriteClass);
        return [...imported, ...remaining];
      }
      return [...imported, ...prev];
    });
  };

  // Save Attendance Record updates
  const handleSaveAttendance = (updatedRecords: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      updatedRecords.forEach((rec) => {
        map.set(rec.id, rec);
      });
      return Array.from(map.values());
    });
  };

  // Leave Approvals
  const handleApproveLeave = (leaveId: string) => {
    const leave = leaves.find((l) => l.id === leaveId);
    if (!leave) return;

    // 1. Update leave status
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId ? { ...l, status: 'Đã duyệt', approvedBy: 'Cô Nguyễn Thị Hoa' } : l
      )
    );

    // 2. Automatically sync to Attendance Records for those dates as Vang_P
    const student = students.find((s) => s.id === leave.studentId);
    if (student) {
      const newAttRecord: AttendanceRecord = {
        id: `att_${student.id}_${leave.fromDate}`,
        studentId: student.id,
        date: leave.fromDate,
        className: student.className,
        periods: { 1: 'Vang_P', 2: 'Vang_P', 3: 'Vang_P', 4: 'Vang_P', 5: 'Vang_P' },
        overallStatus: 'Vang_P',
        note: `Nghỉ có phép: ${leave.reason}`,
        minutesLate: 0,
        updatedAt: new Date().toISOString(),
        notifiedParent: true,
        notifiedTime: new Date().toLocaleTimeString('vi-VN'),
      };

      handleSaveAttendance([newAttRecord]);

      // 3. Log notification
      const logItem: NotificationLog = {
        id: `log_${Date.now()}`,
        studentId: student.id,
        studentName: student.fullName,
        className: student.className,
        parentPhone: student.parentPhone,
        channel: 'Zalo',
        type: 'Đơn xin nghỉ',
        content: `Nhà trường đã DUYỆT đơn xin nghỉ phép của em ${student.fullName} ngày ${leave.fromDate}. Lý do: ${leave.reason}.`,
        sentAt: new Date().toLocaleString('vi-VN'),
        status: 'Đã gửi',
      };
      setNotifLogs((prev) => [logItem, ...prev]);
    }
  };

  const handleRejectLeave = (leaveId: string, reason?: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId ? { ...l, status: 'Từ chối', rejectionReason: reason || 'Chưa duyệt' } : l
      )
    );
  };

  const handleCreateLeave = (newLeave: AbsenceLeave) => {
    setLeaves((prev) => [newLeave, ...prev]);
  };

  // Send Notification Handler
  const handleConfirmSendNotification = (student: Student, channel: 'Zalo' | 'SMS', message: string) => {
    const newLog: NotificationLog = {
      id: `log_${Date.now()}`,
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
        onResetData={handleResetData}
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
              onResetData={handleResetData}
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

      {/* Gmail Auth Modal */}
      <GmailAuthModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        currentAccount={currentTeacher}
        onLogin={(acc) => {
          setCurrentTeacher(acc);
          alert(`Đã đăng nhập thành công với tài khoản Gmail: ${acc.email} (${acc.name})!`);
        }}
      />
    </div>
  );
}
