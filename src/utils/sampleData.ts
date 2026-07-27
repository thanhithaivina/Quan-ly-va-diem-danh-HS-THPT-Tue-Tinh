import { Student, ClassInfo, AttendanceRecord, AbsenceLeave, NotificationLog, NotificationTemplate, NotificationChannelConfig } from '../types';
import { parseVietnameseName, sortStudentsAlphabetically } from './vietnameseSort';

// Generate Classes for Khối 10, 11, 12 and Classes A to I
const CLASS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const GRADES = [
  { grade: 'Khối 10', prefix: '10', defaultTeacher: 'Cô Nguyễn Thị Hoa' },
  { grade: 'Khối 11', prefix: '11', defaultTeacher: 'Cô Phạm Thanh Thảo' },
  { grade: 'Khối 12', prefix: '12', defaultTeacher: 'Thầy Bùi Quang Hải' },
];

export const INITIAL_CLASSES: ClassInfo[] = GRADES.flatMap((g) =>
  CLASS_LETTERS.map((letter, idx) => ({
    id: `${g.prefix}${letter}`,
    name: `${g.prefix}${letter}`,
    grade: g.grade,
    homeroomTeacher: letter === 'A' ? g.defaultTeacher : `Thầy/Cô Chủ Nhiệm ${g.prefix}${letter}`,
    schoolYear: '2025-2026',
    roomNumber: `P.${g.prefix}0${idx + 1}`,
  }))
);

const RAW_STUDENTS_SAMPLE = [
  { code: '001201008291', fullName: 'Nguyễn Văn An', gender: 'Nam', dob: '2010-03-15', parentName: 'Nguyễn Văn Bình (Bố)', parentPhone: '0912345678', parentEmail: 'nguyenvanbinh@gmail.com', role: 'Lớp trưởng', address: 'Số 12 Lý Thường Kiệt, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008292', fullName: 'Trần Thị Bảo An', gender: 'Nữ', dob: '2010-07-20', parentName: 'Trần Quốc Bảo (Bố)', parentPhone: '0987654321', parentEmail: 'tranquocbao@gmail.com', role: 'Lớp phó', address: 'Số 45 Lê Lợi, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008293', fullName: 'Lê Hoàng Bách', gender: 'Nam', dob: '2010-01-10', parentName: 'Lê Văn Hoàng (Bố)', parentPhone: '0903112233', parentEmail: 'lehoang@gmail.com', role: 'Học sinh', address: 'Số 88 Hai Bà Trưng, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008294', fullName: 'Phạm Ngọc Bình', gender: 'Nữ', dob: '2010-09-05', parentName: 'Phạm Văn Ngọc (Mẹ)', parentPhone: '0918889900', parentEmail: 'phamngoc@gmail.com', role: 'Cán sự môn', address: 'Số 102 Trần Hưng Đạo, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008295', fullName: 'Bùi Đức Cường', gender: 'Nam', dob: '2010-11-12', parentName: 'Bùi Văn Đức (Bố)', parentPhone: '0977112244', parentEmail: 'buicong@gmail.com', role: 'Học sinh', address: 'Số 15 Nguyễn Trãi, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008296', fullName: 'Vũ Thị Phương Dung', gender: 'Nữ', dob: '2010-04-18', parentName: 'Vũ Văn Phương (Mẹ)', parentPhone: '0933445566', parentEmail: 'vudung@gmail.com', role: 'Học sinh', address: 'Số 27 Kim Mã, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008297', fullName: 'Đỗ Tuấn Đạt', gender: 'Nam', dob: '2010-08-25', parentName: 'Đỗ Văn Tuấn (Bố)', parentPhone: '0966778899', parentEmail: 'dodat@gmail.com', role: 'Học sinh', address: 'Số 59 Hoàng Hoa Thám, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008298', fullName: 'Đặng Minh Đức', gender: 'Nam', dob: '2010-05-30', parentName: 'Đặng Quốc Minh (Bố)', parentPhone: '0944556677', parentEmail: 'dangduc@gmail.com', role: 'Học sinh', address: 'Số 73 Tây Sơn, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008299', fullName: 'Hoàng Thị Giang', gender: 'Nữ', dob: '2010-02-14', parentName: 'Hoàng Văn Nam (Mẹ)', parentPhone: '0922334455', parentEmail: 'hoanggiang@gmail.com', role: 'Học sinh', address: 'Số 31 Cầu Giấy, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008300', fullName: 'Ngô Việt Hà', gender: 'Nữ', dob: '2010-10-08', parentName: 'Ngô Văn Việt (Bố)', parentPhone: '0955667788', parentEmail: 'ngoha@gmail.com', role: 'Học sinh', address: 'Số 90 Xuân Thủy, Hà Nội', grade: 'Khối 10', className: '10A', homeroomTeacher: 'Cô Nguyễn Thị Hoa' },
  { code: '001201008301', fullName: 'Dương Khánh Hải', gender: 'Nam', dob: '2010-06-22', parentName: 'Dương Văn Khánh (Bố)', parentPhone: '0911223344', parentEmail: 'duonghai@gmail.com', role: 'Học sinh', address: 'Số 14 Đội Cấn, Hà Nội', grade: 'Khối 10', className: '10B', homeroomTeacher: 'Thầy Trần Văn Minh' },
  { code: '001201008302', fullName: 'Nguyễn Thị Thu Hằng', gender: 'Nữ', dob: '2010-12-01', parentName: 'Nguyễn Văn Thu (Mẹ)', parentPhone: '0988990011', parentEmail: 'nguyenhang@gmail.com', role: 'Học sinh', address: 'Số 62 Chùa Bộc, Hà Nội', grade: 'Khối 10', className: '10B', homeroomTeacher: 'Thầy Trần Văn Minh' },
  { code: '001201008303', fullName: 'Phạm Gia Huy', gender: 'Nam', dob: '2010-03-29', parentName: 'Phạm Văn Gia (Bố)', parentPhone: '0977889900', parentEmail: 'phamhuy@gmail.com', role: 'Học sinh', address: 'Số 18 Phạm Ngọc Thạch, Hà Nội', grade: 'Khối 11', className: '11A', homeroomTeacher: 'Cô Phạm Thanh Thảo' },
  { code: '001201008304', fullName: 'Lê Gia Khánh', gender: 'Nam', dob: '2010-09-17', parentName: 'Lê Quốc Khánh (Bố)', parentPhone: '0933221100', parentEmail: 'lekhanh@gmail.com', role: 'Học sinh', address: 'Số 84 Nguyễn Chí Thanh, Hà Nội', grade: 'Khối 11', className: '11B', homeroomTeacher: 'Thầy Lê Văn Cường' },
  { code: '001201008305', fullName: 'Trần Hoàng Linh', gender: 'Nữ', dob: '2010-07-11', parentName: 'Trần Văn Hoàng (Mẹ)', parentPhone: '0911447788', parentEmail: 'tranlinh@gmail.com', role: 'Học sinh', address: 'Số 41 Giảng Võ, Hà Nội', grade: 'Khối 12', className: '12A', homeroomTeacher: 'Thầy Bùi Quang Hải' },
];

export const INITIAL_STUDENTS: Student[] = sortStudentsAlphabetically(
  RAW_STUDENTS_SAMPLE.map((item, idx) => {
    const { firstName, lastName } = parseVietnameseName(item.fullName);
    return {
      id: `std_${idx + 1}`,
      code: item.code,
      fullName: item.fullName,
      firstName,
      lastName,
      className: item.className,
      grade: item.grade,
      gender: item.gender as 'Nam' | 'Nữ',
      dob: item.dob,
      parentName: item.parentName,
      parentPhone: item.parentPhone,
      homeroomTeacher: item.homeroomTeacher,
      parentEmail: item.parentEmail,
      role: item.role as any,
      status: 'Đang học',
      address: item.address,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${item.code}`
    };
  })
);

export const INITIAL_CONFIGS: NotificationChannelConfig[] = [
  { id: 'zalo_cfg', channel: 'Zalo', enabled: true, oaId: 'OA_TRUONG_THPT_2026', autoSendOnAbsence: true },
  { id: 'sms_cfg', channel: 'SMS', enabled: true, senderName: 'THPT_EDU', autoSendOnAbsence: true },
  { id: 'zns_cfg', channel: 'Zalo ZNS', enabled: false, apiKey: 'ZNS_API_KEY_DEMO', autoSendOnAbsence: false },
];

export const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl_vang_kp',
    name: 'Thông báo vắng không phép',
    channel: 'Zalo',
    type: 'Vang_KP',
    content: 'Trường THPT xin thông báo: Học sinh {TenHocSinh} (Lớp {Lop}) vắng mặt không phép vào ngày {ThoiGian}. Kính đề nghị Phụ huynh liên hệ ngay với GVCN ({GiaoVien}) để trao đổi.',
    isDefault: true,
  },
  {
    id: 'tpl_vang_p',
    name: 'Thông báo vắng có phép',
    channel: 'Zalo',
    type: 'Vang_P',
    content: 'Kính gửi Phụ huynh: Nhà trường đã ghi nhận đơn xin nghỉ phép của học sinh {TenHocSinh} (Lớp {Lop}) vào ngày {ThoiGian}. Lý do: {LyDo}. Chúc em sớm trở lại lớp học!',
    isDefault: true,
  },
  {
    id: 'tpl_di_muon',
    name: 'Thông báo đi học muộn',
    channel: 'SMS',
    type: 'Di_Muon',
    content: 'THPT Edu: Học sinh {TenHocSinh} Lớp {Lop} đi muộn {SoPhut} phút vào sáng ngày {ThoiGian}. Rất mong Phụ huynh nhắc nhở em đi học đúng giờ.',
    isDefault: true,
  },
];

export const INITIAL_LEAVES: AbsenceLeave[] = [
  {
    id: 'leave_101',
    studentId: 'std_5',
    studentName: 'Bùi Đức Cường',
    className: '10A',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    periods: [1, 2, 3, 4, 5],
    reason: 'Sốt cao, đi khám bệnh tại Bệnh viện Nhi',
    requestedBy: 'Bố: Bùi Văn Đức',
    parentPhone: '0977112244',
    status: 'Đã duyệt',
    createdAt: new Date().toISOString(),
    approvedBy: 'Cô Nguyễn Thị Hoa'
  },
  {
    id: 'leave_102',
    studentId: 'std_9',
    studentName: 'Hoàng Thị Giang',
    className: '10A',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    periods: [1, 2],
    reason: 'Gia đình có việc hiếu đột xuất',
    requestedBy: 'Mẹ: Hoàng Thị Mai',
    parentPhone: '0922334455',
    status: 'Chờ duyệt',
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: 'log_1',
    studentId: 'std_7',
    studentName: 'Đỗ Tuấn Đạt',
    className: '10A',
    parentPhone: '0966778899',
    channel: 'Zalo',
    type: 'Vắng không phép',
    content: 'Trường THPT xin thông báo: Học sinh Đỗ Tuấn Đạt (Lớp 10A) vắng mặt không phép vào ngày 25/07/2026. Kính đề nghị Phụ huynh liên hệ với GVCN Cô Nguyễn Thị Hoa.',
    sentAt: '2026-07-25 07:45:12',
    status: 'Đã xem'
  },
  {
    id: 'log_2',
    studentId: 'std_5',
    studentName: 'Bùi Đức Cường',
    className: '10A',
    parentPhone: '0977112244',
    channel: 'Zalo',
    type: 'Vắng có phép',
    content: 'Kính gửi Phụ huynh: Nhà trường đã ghi nhận đơn xin nghỉ phép của học sinh Bùi Đức Cường (Lớp 10A) vào ngày 25/07/2026. Lý do: Sốt cao đi khám bệnh.',
    sentAt: '2026-07-25 07:30:00',
    status: 'Đã gửi'
  }
];

// Helper to generate realistic historical attendance records for the last 14 days
export function generateSampleAttendanceHistory(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dateStr = d.toISOString().split('T')[0];

    students.forEach((student) => {
      // Deterministic pseudo-random seed based on student.id + dateStr
      const hash = (student.id.length * 13 + dateStr.charCodeAt(dateStr.length - 1) * 7 + i * 19) % 100;
      let overall: 'Co_Mat' | 'Vang_P' | 'Vang_KP' | 'Di_Muon' | 'Nghi_Om' = 'Co_Mat';
      let note = '';
      let minutesLate = 0;

      if (hash < 82) {
        overall = 'Co_Mat';
      } else if (hash < 89) {
        overall = 'Di_Muon';
        minutesLate = (hash % 3 + 1) * 10;
        note = `Đi muộn ${minutesLate} phút`;
      } else if (hash < 94) {
        overall = 'Vang_P';
        note = 'Gia đình gọi điện xin nghỉ';
      } else if (hash < 98) {
        overall = 'Vang_KP';
        note = 'Không rõ lý do';
      } else {
        overall = 'Nghi_Om';
        note = 'Sốt nhức đầu';
      }

      const periods: Record<number, 'Co_Mat' | 'Vang_P' | 'Vang_KP' | 'Di_Muon' | 'Nghi_Om'> = {};
      for (let p = 1; p <= 10; p++) {
        if (overall === 'Co_Mat') {
          periods[p] = 'Co_Mat';
        } else if (overall === 'Di_Muon') {
          periods[p] = p === 1 ? 'Di_Muon' : 'Co_Mat';
        } else {
          periods[p] = overall;
        }
      }

      records.push({
        id: `att_${student.id}_${dateStr}`,
        studentId: student.id,
        date: dateStr,
        className: student.className,
        periods,
        overallStatus: overall,
        note,
        minutesLate,
        updatedAt: new Date(d.getTime() + 7 * 3600 * 1000).toISOString(),
        notifiedParent: overall !== 'Co_Mat',
        notifiedTime: overall !== 'Co_Mat' ? `${dateStr} 07:50:00` : undefined,
      });
    });
  }

  return records;
}
