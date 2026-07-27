export type AttendanceStatus = 'Co_Mat' | 'Vang_P' | 'Vang_KP' | 'Di_Muon' | 'Nghi_Om';

export type Gender = 'Nam' | 'Nữ';

export type StudentRole = 'Lớp trưởng' | 'Lớp phó' | 'Cán sự môn' | 'Học sinh';

export interface TeacherAccount {
  email: string;
  name: string;
  school: string;
  role: string;
  subject?: string;
  assignedClasses: string[];
  avatar?: string;
}

export interface Student {
  id: string;
  code: string; // Mã định danh Bộ GD&ĐT
  fullName: string; // Họ và tên
  firstName: string;
  lastName: string;
  className: string; // Lớp (A -> I) e.g. 10A
  grade: string; // Khối 10, Khối 11, Khối 12
  gender: Gender;
  dob: string; // YYYY-MM-DD
  parentName: string; // Họ tên Bố/Mẹ
  parentPhone: string; // Số điện thoại gửi Zalo
  homeroomTeacher: string; // Tên giáo viên chủ nhiệm
  parentEmail?: string;
  role: StudentRole;
  status: 'Đang học' | 'Chuyển trường' | 'Thôi học';
  address?: string;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  className: string;
  // Periods 1 to 5 (Sáng), 6 to 10 (Chiều)
  periods: Record<number, AttendanceStatus>;
  periodSubjects?: Record<number, string>; // Môn học tương ứng từng tiết
  selectedSubject?: string; // Môn học đang chọn điểm danh
  overallStatus: AttendanceStatus;
  note?: string;
  minutesLate?: number;
  updatedAt: string;
  notifiedParent: boolean;
  notifiedTime?: string;
}

export interface AbsenceLeave {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  periods?: number[]; // [1, 2, 3] or empty for all day
  reason: string;
  requestedBy: string; // e.g., "Mẹ em Nguyễn Văn An"
  parentPhone: string;
  source?: 'Zalo' | 'Thủ công' | 'Web';
  rawZaloMessage?: string;
  evidenceUrl?: string; // Optional URL for doctor note / image
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  createdAt: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface NotificationLog {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentPhone: string;
  channel: 'Zalo' | 'SMS' | 'Zalo ZNS';
  type: 'Vắng không phép' | 'Vắng có phép' | 'Đi muộn' | 'Đơn xin nghỉ';
  content: string;
  sentAt: string;
  status: 'Đã gửi' | 'Đã xem' | 'Thất bại';
  errorDetails?: string;
}

export interface NotificationChannelConfig {
  id: string;
  channel: 'Zalo' | 'SMS' | 'Zalo ZNS';
  enabled: boolean;
  apiKey?: string;
  oaId?: string;
  senderName?: string;
  autoSendOnAbsence: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'Zalo' | 'SMS';
  type: 'Vang_KP' | 'Vang_P' | 'Di_Muon' | 'Tong_Hop';
  content: string;
  isDefault: boolean;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  homeroomTeacher: string;
  schoolYear: string;
  roomNumber: string;
}

export type TimeRangeOption = 'today' | 'week' | 'month' | 'semester1' | 'semester2' | 'year' | 'custom';

export interface ExportFilter {
  className: string;
  studentId?: string; // empty means all
  timeRange: TimeRangeOption;
  startDate?: string;
  endDate?: string;
}
