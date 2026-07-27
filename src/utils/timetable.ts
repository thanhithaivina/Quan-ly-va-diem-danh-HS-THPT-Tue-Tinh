// Timetable utility, custom persistence, CSV import/export, and teacher schedule definitions

export interface PeriodDetail {
  subject: string;
  teacher?: string;
  room?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const DAY_KEYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DAY_NAMES: Record<DayOfWeek, string> = {
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
};

export const SUBJECT_LIST = [
  'Toán Học',
  'Ngữ Văn',
  'Tiếng Anh',
  'Vật Lý',
  'Hóa Học',
  'Sinh Học',
  'Lịch Sử',
  'Địa Lý',
  'GDCD / GDKT-PL',
  'Tin Học',
  'Thể Dục',
  'Giáo Dục Quốc Phòng',
  'Công Nghệ',
  'Hoạt Động Trải Nghiệm',
  'Sinh Hoạt Lớp / Chào Cờ',
  'Tự Học',
];

export const PERIOD_TIMES: Record<number, string> = {
  1: '07:00 - 07:45',
  2: '07:50 - 08:35',
  3: '08:50 - 09:35',
  4: '09:40 - 10:25',
  5: '10:30 - 11:15',
  6: '13:00 - 13:45',
  7: '13:50 - 14:35',
  8: '14:50 - 15:35',
  9: '15:40 - 16:25',
  10: '16:30 - 17:15',
};

// Default Timetable template per class
export type WeeklyClassSchedule = Record<DayOfWeek, Record<number, PeriodDetail>>;

const DEFAULT_SINGLE_WEEK: WeeklyClassSchedule = {
  Monday: {
    1: { subject: 'Sinh Hoạt Lớp / Chào Cờ', teacher: 'Thầy Hiệu Trưởng', room: 'Sân Trường' },
    2: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    3: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    4: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    5: { subject: 'Vật Lý', teacher: 'Thầy Phạm Văn D', room: 'P.Lab1' },
    6: { subject: 'Hóa Học', teacher: 'Cô Lê Thị E', room: 'P.Lab2' },
    7: { subject: 'Sinh Học', teacher: 'Thầy Vũ Văn F', room: 'P.101' },
    8: { subject: 'Lịch Sử', teacher: 'Cô Đặng Thị G', room: 'P.101' },
    9: { subject: 'Địa Lý', teacher: 'Thầy Bùi Văn H', room: 'P.101' },
    10: { subject: 'Tin Học', teacher: 'Thầy Ngô Văn I', room: 'P.Máy1' },
  },
  Tuesday: {
    1: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    2: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    3: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    4: { subject: 'Hóa Học', teacher: 'Cô Lê Thị E', room: 'P.Lab2' },
    5: { subject: 'Thể Dục', teacher: 'Thầy Dương Văn K', room: 'Sân Tập' },
    6: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    7: { subject: 'Vật Lý', teacher: 'Thầy Phạm Văn D', room: 'P.101' },
    8: { subject: 'Công Nghệ', teacher: 'Thầy Đỗ Văn L', room: 'P.101' },
    9: { subject: 'GDCD / GDKT-PL', teacher: 'Cô Lý Thị M', room: 'P.101' },
    10: { subject: 'Hoạt Động Trải Nghiệm', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
  },
  Wednesday: {
    1: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    2: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    3: { subject: 'Lịch Sử', teacher: 'Cô Đặng Thị G', room: 'P.101' },
    4: { subject: 'Địa Lý', teacher: 'Thầy Bùi Văn H', room: 'P.101' },
    5: { subject: 'Tin Học', teacher: 'Thầy Ngô Văn I', room: 'P.Máy1' },
    6: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    7: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    8: { subject: 'Giáo Dục Quốc Phòng', teacher: 'Thầy Trịnh Văn N', room: 'Sân Tập' },
    9: { subject: 'Sinh Học', teacher: 'Thầy Vũ Văn F', room: 'P.101' },
    10: { subject: 'Vật Lý', teacher: 'Thầy Phạm Văn D', room: 'P.101' },
  },
  Thursday: {
    1: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    2: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    3: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    4: { subject: 'GDCD / GDKT-PL', teacher: 'Cô Lý Thị M', room: 'P.101' },
    5: { subject: 'Công Nghệ', teacher: 'Thầy Đỗ Văn L', room: 'P.101' },
    6: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    7: { subject: 'Hóa Học', teacher: 'Cô Lê Thị E', room: 'P.101' },
    8: { subject: 'Thể Dục', teacher: 'Thầy Dương Văn K', room: 'Sân Tập' },
    9: { subject: 'Lịch Sử', teacher: 'Cô Đặng Thị G', room: 'P.101' },
    10: { subject: 'Hoạt Động Trải Nghiệm', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
  },
  Friday: {
    1: { subject: 'Vật Lý', teacher: 'Thầy Phạm Văn D', room: 'P.101' },
    2: { subject: 'Vật Lý', teacher: 'Thầy Phạm Văn D', room: 'P.101' },
    3: { subject: 'Hóa Học', teacher: 'Cô Lê Thị E', room: 'P.101' },
    4: { subject: 'Tiếng Anh', teacher: 'Cô Hoàng Minh C', room: 'P.101' },
    5: { subject: 'Giáo Dục Quốc Phòng', teacher: 'Thầy Trịnh Văn N', room: 'Sân Tập' },
    6: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    7: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    8: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    9: { subject: 'Địa Lý', teacher: 'Thầy Bùi Văn H', room: 'P.101' },
    10: { subject: 'Tin Học', teacher: 'Thầy Ngô Văn I', room: 'P.Máy1' },
  },
  Saturday: {
    1: { subject: 'Toán Học', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    2: { subject: 'Ngữ Văn', teacher: 'Cô Trần Thị B', room: 'P.101' },
    3: { subject: 'Sinh Học', teacher: 'Thầy Vũ Văn F', room: 'P.101' },
    4: { subject: 'Hoạt Động Trải Nghiệm', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    5: { subject: 'Sinh Hoạt Lớp / Chào Cờ', teacher: 'GV Nguyễn Văn A', room: 'P.101' },
    6: { subject: 'Tự Học', teacher: '', room: 'P.101' },
    7: { subject: 'Tự Học', teacher: '', room: 'P.101' },
    8: { subject: 'Tự Học', teacher: '', room: 'P.101' },
    9: { subject: 'Tự Học', teacher: '', room: 'P.101' },
    10: { subject: 'Tự Học', teacher: '', room: 'P.101' },
  },
};

const STORAGE_KEY = 'app_timetable_schedules_v1';

// Load stored timetables or return defaults
export function loadAllTimetables(): Record<string, WeeklyClassSchedule> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load timetables from storage:', e);
  }
  return {};
}

// Save timetables to storage
export function saveAllTimetables(data: Record<string, WeeklyClassSchedule>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save timetables:', e);
  }
}

// Get class schedule (with fallback to default)
export function getClassTimetable(className: string): WeeklyClassSchedule {
  const all = loadAllTimetables();
  if (all[className]) {
    return all[className];
  }
  return DEFAULT_SINGLE_WEEK;
}

// Save class schedule
export function saveClassTimetable(className: string, schedule: WeeklyClassSchedule) {
  const all = loadAllTimetables();
  all[className] = schedule;
  saveAllTimetables(all);
}

// Helper: Day mapping
export function getVietnameseDayOfWeek(dateStr: string): { dayName: string; dayKey: DayOfWeek; formattedDate: string } {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return { dayName: 'Thứ Hai', dayKey: 'Monday', formattedDate: dateStr };
  }

  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayKeys: DayOfWeek[] = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const parts = dateStr.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;

  return {
    dayName: dayNames[dayIndex],
    dayKey: dayKeys[dayIndex],
    formattedDate,
  };
}

// Get scheduled subject for a date & period
export function getScheduledSubject(className: string, dateStr: string, periodNum: number): string {
  const { dayKey } = getVietnameseDayOfWeek(dateStr);
  const classSchedule = getClassTimetable(className);
  const daySchedule = classSchedule[dayKey] || DEFAULT_SINGLE_WEEK[dayKey];
  return daySchedule[periodNum]?.subject || 'Toán Học';
}

export function getFullDaySchedule(className: string, dateStr: string): Record<number, string> {
  const { dayKey } = getVietnameseDayOfWeek(dateStr);
  const classSchedule = getClassTimetable(className);
  const daySchedule = classSchedule[dayKey] || DEFAULT_SINGLE_WEEK[dayKey];

  const result: Record<number, string> = {};
  for (let p = 1; p <= 10; p++) {
    result[p] = daySchedule[p]?.subject || 'Toán Học';
  }
  return result;
}

// Get schedule for a specific Teacher across all classes
export interface TeacherPeriodSchedule {
  className: string;
  dayKey: DayOfWeek;
  period: number;
  subject: string;
  room?: string;
}

export function getScheduleByTeacher(teacherName: string, knownClasses: string[]): TeacherPeriodSchedule[] {
  if (!teacherName) return [];
  const allTimetables = loadAllTimetables();
  const searchName = teacherName.trim().toLowerCase();
  const results: TeacherPeriodSchedule[] = [];

  // Use known classes + any classes in allTimetables
  const classList = Array.from(new Set([...knownClasses, ...Object.keys(allTimetables), '10A1', '11A1', '12A1']));

  classList.forEach((cName) => {
    const sched = allTimetables[cName] || DEFAULT_SINGLE_WEEK;
    DAY_KEYS.forEach((dayKey) => {
      const dayData = sched[dayKey];
      if (dayData) {
        for (let p = 1; p <= 10; p++) {
          const detail = dayData[p];
          if (detail && detail.teacher && detail.teacher.toLowerCase().includes(searchName)) {
            results.push({
              className: cName,
              dayKey,
              period: p,
              subject: detail.subject,
              room: detail.room,
            });
          }
        }
      }
    });
  });

  return results;
}

// Download Sample CSV template
export function downloadSampleTimetableCSV() {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel
    'Lop,Thu,Tiet,MonHoc,GiaoVien,PhongHoc\n' +
    '12A1,Thư Hai,1,Sinh Hoạt Lớp / Chào Cờ,Thầy Hiệu Trưởng,Sân Trường\n' +
    '12A1,Thứ Hai,2,Toán Học,GV Nguyễn Văn A,P.101\n' +
    '12A1,Thứ Hai,3,Ngữ Văn,Cô Trần Thị B,P.101\n' +
    '12A1,Thứ Hai,4,Tiếng Anh,Cô Hoàng Minh C,P.101\n' +
    '12A1,Thứ Hai,5,Vật Lý,Thầy Phạm Văn D,P.Lab1\n' +
    '12A1,Thứ Ba,1,Ngữ Văn,Cô Trần Thị B,P.101\n' +
    '12A1,Thứ Ba,2,Ngữ Văn,Cô Trần Thị B,P.101\n' +
    '12A1,Thứ Ba,3,Toán Học,GV Nguyễn Văn A,P.101\n' +
    '12A1,Thứ Ba,4,Hóa Học,Cô Lê Thị E,P.Lab2\n' +
    '12A1,Thứ Ba,5,Thể Dục,Thầy Dương Văn K,Sân Tập\n' +
    '10A1,Thứ Hai,1,Toán Học,GV Nguyễn Văn A,P.201\n' +
    '10A1,Thứ Hai,2,Vật Lý,Thầy Phạm Văn D,P.201\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'ThoiKhoaBieu_FileMau.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Day name parser mapping
function parseDayKey(rawDay: string): DayOfWeek | null {
  const clean = rawDay.trim().toLowerCase();
  if (clean.includes('hai') || clean.includes('mon') || clean === 't2' || clean === '2') return 'Monday';
  if (clean.includes('ba') || clean.includes('tue') || clean === 't3' || clean === '3') return 'Tuesday';
  if (clean.includes('tư') || clean.includes('tu') || clean.includes('wed') || clean === 't4' || clean === '4') return 'Wednesday';
  if (clean.includes('năm') || clean.includes('nam') || clean.includes('thu') || clean === 't5' || clean === '5') return 'Thursday';
  if (clean.includes('sáu') || clean.includes('sau') || clean.includes('fri') || clean === 't6' || clean === '6') return 'Friday';
  if (clean.includes('bảy') || clean.includes('bay') || clean.includes('sat') || clean === 't7' || clean === '7') return 'Saturday';
  return null;
}

// Parse imported CSV or JSON text and merge into storage
export function importTimetableFromText(text: string): { success: boolean; count: number; classes: string[]; error?: string } {
  try {
    // Try JSON first
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object') {
        const all = loadAllTimetables();
        let totalCount = 0;
        const importedClasses: string[] = [];

        if (Array.isArray(parsed)) {
          // Array of entries: [{ className: '12A1', day: 'Monday', period: 1, subject: 'Toán', teacher: 'A' }]
          parsed.forEach((item) => {
            const cName = item.className || item.Lop || '12A1';
            const dayKey = parseDayKey(item.day || item.Thu || '') || 'Monday';
            const period = Number(item.period || item.Tiet || 1);
            const subject = item.subject || item.MonHoc || 'Toán Học';
            const teacher = item.teacher || item.GiaoVien || '';
            const room = item.room || item.PhongHoc || '';

            if (!all[cName]) {
              all[cName] = JSON.parse(JSON.stringify(DEFAULT_SINGLE_WEEK));
            }
            if (!all[cName][dayKey]) {
              all[cName][dayKey] = {};
            }
            all[cName][dayKey][period] = { subject, teacher, room };
            totalCount++;
            if (!importedClasses.includes(cName)) importedClasses.push(cName);
          });
        } else {
          // Object structure
          Object.keys(parsed).forEach((cName) => {
            all[cName] = parsed[cName];
            importedClasses.push(cName);
            totalCount += 60;
          });
        }

        saveAllTimetables(all);
        return { success: true, count: totalCount, classes: importedClasses };
      }
    }

    // CSV parsing line-by-line
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, count: 0, classes: [], error: 'File rỗng hoặc không đúng định dạng CSV/JSON' };
    }

    const all = loadAllTimetables();
    let importedCount = 0;
    const importedClassesSet = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 4) continue;

      const [cName, rawDay, rawPeriod, subject, teacher, room] = parts;
      const dayKey = parseDayKey(rawDay);
      const periodNum = parseInt(rawPeriod, 10);

      if (!cName || !dayKey || isNaN(periodNum) || periodNum < 1 || periodNum > 10) {
        continue;
      }

      if (!all[cName]) {
        all[cName] = JSON.parse(JSON.stringify(DEFAULT_SINGLE_WEEK));
      }

      all[cName][dayKey][periodNum] = {
        subject: subject || 'Toán Học',
        teacher: teacher || '',
        room: room || '',
      };

      importedCount++;
      importedClassesSet.add(cName);
    }

    if (importedCount === 0) {
      return { success: false, count: 0, classes: [], error: 'Không đọc được dữ liệu thời khóa biểu hợp lệ nào từ file CSV' };
    }

    saveAllTimetables(all);
    return { success: true, count: importedCount, classes: Array.from(importedClassesSet) };
  } catch (err: any) {
    return { success: false, count: 0, classes: [], error: err?.message || 'Lỗi khi đọc file' };
  }
}
