import { Student, ClassInfo, AttendanceRecord, AbsenceLeave, NotificationLog, NotificationChannelConfig, NotificationTemplate } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASSES, INITIAL_CONFIGS, INITIAL_TEMPLATES, INITIAL_LEAVES, INITIAL_NOTIFICATION_LOGS, generateSampleAttendanceHistory } from './sampleData';

const KEYS = {
  STUDENTS: 'app_students_v1',
  CLASSES: 'app_classes_v1',
  ATTENDANCE: 'app_attendance_v1',
  LEAVES: 'app_leaves_v1',
  NOTIF_LOGS: 'app_notif_logs_v1',
  CONFIGS: 'app_configs_v1',
  TEMPLATES: 'app_templates_v1',
};

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (!raw) {
      const initial = INITIAL_STUDENTS;
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(initial));
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

export function saveStoredStudents(students: Student[]) {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
}

export function getStoredClasses(): ClassInfo[] {
  try {
    const raw = localStorage.getItem(KEYS.CLASSES);
    let classesList: ClassInfo[] = raw ? JSON.parse(raw) : [...INITIAL_CLASSES];
    
    // Remove unwanted classes 10A1, 10A2, 11A1, 12A1
    const forbidden = ['10A1', '10A2', '11A1', '12A1'];
    classesList = classesList.filter((c) => !forbidden.includes(c.name));

    // Always guarantee all 27 classes (10A..10I, 11A..11I, 12A..12I) exist
    const existingNames = new Set(classesList.map((c) => c.name));
    let updated = false;
    INITIAL_CLASSES.forEach((ic) => {
      if (!existingNames.has(ic.name)) {
        classesList.push(ic);
        updated = true;
      }
    });

    if (updated || !raw) {
      localStorage.setItem(KEYS.CLASSES, JSON.stringify(classesList));
    }
    return classesList;
  } catch {
    return INITIAL_CLASSES;
  }
}

export function saveStoredClasses(classes: ClassInfo[]) {
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    if (!raw) {
      const students = getStoredStudents();
      const initialHistory = generateSampleAttendanceHistory(students);
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(initialHistory));
      return initialHistory;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredAttendance(records: AttendanceRecord[]) {
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
}

export function getStoredLeaves(): AbsenceLeave[] {
  try {
    const raw = localStorage.getItem(KEYS.LEAVES);
    if (!raw) {
      localStorage.setItem(KEYS.LEAVES, JSON.stringify(INITIAL_LEAVES));
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

export function saveStoredLeaves(leaves: AbsenceLeave[]) {
  localStorage.setItem(KEYS.LEAVES, JSON.stringify(leaves));
}

export function getStoredNotifLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTIF_LOGS);
    if (!raw) {
      localStorage.setItem(KEYS.NOTIF_LOGS, JSON.stringify(INITIAL_NOTIFICATION_LOGS));
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

export function saveStoredNotifLogs(logs: NotificationLog[]) {
  localStorage.setItem(KEYS.NOTIF_LOGS, JSON.stringify(logs));
}

export function getStoredConfigs(): NotificationChannelConfig[] {
  try {
    const raw = localStorage.getItem(KEYS.CONFIGS);
    if (!raw) {
      localStorage.setItem(KEYS.CONFIGS, JSON.stringify(INITIAL_CONFIGS));
      return INITIAL_CONFIGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONFIGS;
  }
}

export function saveStoredConfigs(configs: NotificationChannelConfig[]) {
  localStorage.setItem(KEYS.CONFIGS, JSON.stringify(configs));
}

export function getStoredTemplates(): NotificationTemplate[] {
  try {
    const raw = localStorage.getItem(KEYS.TEMPLATES);
    if (!raw) {
      localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEMPLATES;
  }
}

export function saveStoredTemplates(templates: NotificationTemplate[]) {
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
}

export function resetAllToDefault() {
  localStorage.clear();
  const students = INITIAL_STUDENTS;
  const history = generateSampleAttendanceHistory(students);
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(history));
  localStorage.setItem(KEYS.LEAVES, JSON.stringify(INITIAL_LEAVES));
  localStorage.setItem(KEYS.NOTIF_LOGS, JSON.stringify(INITIAL_NOTIFICATION_LOGS));
  localStorage.setItem(KEYS.CONFIGS, JSON.stringify(INITIAL_CONFIGS));
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
  return { students, classes: INITIAL_CLASSES, attendance: history, leaves: INITIAL_LEAVES, notifLogs: INITIAL_NOTIFICATION_LOGS };
}
