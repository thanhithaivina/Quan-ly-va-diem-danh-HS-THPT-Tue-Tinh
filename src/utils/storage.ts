import { Student, ClassInfo, AttendanceRecord, AbsenceLeave, NotificationLog, NotificationChannelConfig, NotificationTemplate, TeacherAccount } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASSES, INITIAL_CONFIGS, INITIAL_TEMPLATES, INITIAL_LEAVES, INITIAL_NOTIFICATION_LOGS, generateSampleAttendanceHistory } from './sampleData';

const KEYS = {
  STUDENTS: 'app_students_v1',
  CLASSES: 'app_classes_v1',
  ATTENDANCE: 'app_attendance_v1',
  LEAVES: 'app_leaves_v1',
  NOTIF_LOGS: 'app_notif_logs_v1',
  CONFIGS: 'app_configs_v1',
  TEMPLATES: 'app_templates_v1',
  ACCOUNTS: 'app_registered_accounts_v1',
  CURRENT_TEACHER: 'app_current_teacher_account',
};

export const DEFAULT_TEACHER_ACCOUNT: TeacherAccount = {
  email: 'nguyen.van.hoa@gmail.com',
  password: '123456',
  name: 'Cô Nguyễn Thị Hoa',
  phone: '0903112233',
  subject: 'Môn Toán Học',
  schoolYear: '2025-2026',
  school: 'Trường THPT Tuệ Tĩnh',
  role: 'Giáo viên Chủ Nhiệm 10A',
  assignedClasses: ['10A', '10B', '11A'],
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
};

/**
 * Generate account-scoped storage key for isolating workspace data per teacher account
 */
function getScopedKey(baseKey: string, accountEmail?: string): string {
  let emailToUse = accountEmail;
  if (!emailToUse) {
    try {
      const savedTeacher = localStorage.getItem(KEYS.CURRENT_TEACHER);
      if (savedTeacher) {
        const parsed = JSON.parse(savedTeacher);
        if (parsed?.email) emailToUse = parsed.email;
      }
    } catch {}
  }

  if (!emailToUse) {
    emailToUse = DEFAULT_TEACHER_ACCOUNT.email;
  }

  const emailTag = emailToUse.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${baseKey}_${emailTag}`;
}

// ================= ACCOUNT STORAGE MANAGEMENT =================

export function getRegisteredAccounts(): TeacherAccount[] {
  try {
    const raw = localStorage.getItem(KEYS.ACCOUNTS);
    if (!raw) {
      const initial = [DEFAULT_TEACHER_ACCOUNT];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(initial));
      return initial;
    }
    const accounts: TeacherAccount[] = JSON.parse(raw);
    if (!accounts.some(a => a.email.toLowerCase() === DEFAULT_TEACHER_ACCOUNT.email.toLowerCase())) {
      accounts.unshift(DEFAULT_TEACHER_ACCOUNT);
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return [DEFAULT_TEACHER_ACCOUNT];
  }
}

export function registerNewAccount(newAccount: TeacherAccount): { success: boolean; error?: string; account?: TeacherAccount } {
  const accounts = getRegisteredAccounts();
  const cleanEmail = newAccount.email.trim().toLowerCase();

  // Unique email check
  if (accounts.some(a => a.email.trim().toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: `Địa chỉ Email "${newAccount.email}" đã được đăng ký tài khoản trước đó! Mỗi Email chỉ được đăng ký 1 tài khoản duy nhất. Vui lòng chọn Đăng nhập hoặc sử dụng Email khác.`,
    };
  }

  const accountToSave: TeacherAccount = {
    ...newAccount,
    email: cleanEmail,
    avatar: newAccount.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanEmail}`,
  };

  accounts.unshift(accountToSave);
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  return { success: true, account: accountToSave };
}

export function authenticateAccount(email: string, password?: string): { success: boolean; error?: string; account?: TeacherAccount } {
  const accounts = getRegisteredAccounts();
  const cleanEmail = email.trim().toLowerCase();
  const found = accounts.find(a => a.email.trim().toLowerCase() === cleanEmail);

  if (!found) {
    return {
      success: false,
      error: `Tài khoản với Email "${email}" không tồn tại trên hệ thống. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký tài khoản mới.`,
    };
  }

  if (found.password && password && found.password !== password) {
    return {
      success: false,
      error: 'Mật khẩu đăng nhập không chính xác. Vui lòng thử lại!',
    };
  }

  return { success: true, account: found };
}

export function updateRegisteredAccount(updatedAccount: TeacherAccount): TeacherAccount {
  const accounts = getRegisteredAccounts();
  const cleanEmail = updatedAccount.email.trim().toLowerCase();
  
  const index = accounts.findIndex(a => a.email.trim().toLowerCase() === cleanEmail);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...updatedAccount };
  } else {
    accounts.push(updatedAccount);
  }

  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  localStorage.setItem(KEYS.CURRENT_TEACHER, JSON.stringify(updatedAccount));
  return updatedAccount;
}

// ================= WORKSPACE DATA STORAGE =================

export function getStoredStudents(accountEmail?: string): Student[] {
  try {
    const key = getScopedKey(KEYS.STUDENTS, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = INITIAL_STUDENTS;
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const students: Student[] = JSON.parse(raw);
    return students.map((s) => {
      if (['10A1', '10A2'].includes(s.className)) return { ...s, className: '10A' };
      if (s.className === '11A1') return { ...s, className: '11A' };
      if (s.className === '12A1') return { ...s, className: '12A' };
      return s;
    });
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[], accountEmail?: string) {
  const key = getScopedKey(KEYS.STUDENTS, accountEmail);
  localStorage.setItem(key, JSON.stringify(students));
}

export function getStoredClasses(accountEmail?: string): ClassInfo[] {
  try {
    const key = getScopedKey(KEYS.CLASSES, accountEmail);
    const raw = localStorage.getItem(key);
    let classesList: ClassInfo[] = raw ? JSON.parse(raw) : [...INITIAL_CLASSES];
    
    const forbidden = ['10A1', '10A2', '11A1', '12A1'];
    classesList = classesList.filter((c) => !forbidden.includes(c.name));

    const existingNames = new Set(classesList.map((c) => c.name));
    let updated = false;
    INITIAL_CLASSES.forEach((ic) => {
      if (!existingNames.has(ic.name)) {
        classesList.push(ic);
        updated = true;
      }
    });

    if (updated || !raw) {
      localStorage.setItem(key, JSON.stringify(classesList));
    }
    return classesList;
  } catch {
    return INITIAL_CLASSES;
  }
}

export function saveStoredClasses(classes: ClassInfo[], accountEmail?: string) {
  const key = getScopedKey(KEYS.CLASSES, accountEmail);
  localStorage.setItem(key, JSON.stringify(classes));
}

export function getStoredAttendance(accountEmail?: string): AttendanceRecord[] {
  try {
    const key = getScopedKey(KEYS.ATTENDANCE, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const students = getStoredStudents(accountEmail);
      const initialHistory = generateSampleAttendanceHistory(students);
      localStorage.setItem(key, JSON.stringify(initialHistory));
      return initialHistory;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredAttendance(records: AttendanceRecord[], accountEmail?: string) {
  const key = getScopedKey(KEYS.ATTENDANCE, accountEmail);
  localStorage.setItem(key, JSON.stringify(records));
}

export function getStoredLeaves(accountEmail?: string): AbsenceLeave[] {
  try {
    const key = getScopedKey(KEYS.LEAVES, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_LEAVES));
      return INITIAL_LEAVES;
    }
    const leaves: AbsenceLeave[] = JSON.parse(raw);
    return leaves.map((l) => ({
      ...l,
      className: ['10A1', '10A2'].includes(l.className)
        ? '10A'
        : l.className === '11A1'
        ? '11A'
        : l.className === '12A1'
        ? '12A'
        : l.className,
    }));
  } catch {
    return INITIAL_LEAVES;
  }
}

export function saveStoredLeaves(leaves: AbsenceLeave[], accountEmail?: string) {
  const key = getScopedKey(KEYS.LEAVES, accountEmail);
  localStorage.setItem(key, JSON.stringify(leaves));
}

export function getStoredNotifLogs(accountEmail?: string): NotificationLog[] {
  try {
    const key = getScopedKey(KEYS.NOTIF_LOGS, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_NOTIFICATION_LOGS));
      return INITIAL_NOTIFICATION_LOGS;
    }
    const logs: NotificationLog[] = JSON.parse(raw);
    return logs.map((lg) => ({
      ...lg,
      className: ['10A1', '10A2'].includes(lg.className)
        ? '10A'
        : lg.className === '11A1'
        ? '11A'
        : lg.className === '12A1'
        ? '12A'
        : lg.className,
    }));
  } catch {
    return INITIAL_NOTIFICATION_LOGS;
  }
}

export function saveStoredNotifLogs(logs: NotificationLog[], accountEmail?: string) {
  const key = getScopedKey(KEYS.NOTIF_LOGS, accountEmail);
  localStorage.setItem(key, JSON.stringify(logs));
}

export function getStoredConfigs(accountEmail?: string): NotificationChannelConfig[] {
  try {
    const key = getScopedKey(KEYS.CONFIGS, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_CONFIGS));
      return INITIAL_CONFIGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONFIGS;
  }
}

export function saveStoredConfigs(configs: NotificationChannelConfig[], accountEmail?: string) {
  const key = getScopedKey(KEYS.CONFIGS, accountEmail);
  localStorage.setItem(key, JSON.stringify(configs));
}

export function getStoredTemplates(accountEmail?: string): NotificationTemplate[] {
  try {
    const key = getScopedKey(KEYS.TEMPLATES, accountEmail);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEMPLATES;
  }
}

export function saveStoredTemplates(templates: NotificationTemplate[], accountEmail?: string) {
  const key = getScopedKey(KEYS.TEMPLATES, accountEmail);
  localStorage.setItem(key, JSON.stringify(templates));
}
