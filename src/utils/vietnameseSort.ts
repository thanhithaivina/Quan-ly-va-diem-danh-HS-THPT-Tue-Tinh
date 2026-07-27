import { Student } from '../types';

/**
 * Parses full name into lastName (Họ & đệm) and firstName (Tên chính)
 */
export function parseVietnameseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[parts.length - 1];
  const lastName = parts.slice(0, parts.length - 1).join(' ');
  return { firstName, lastName };
}

/**
 * Sorts students alphabetically by Vietnamese name rules (A-Z by First Name, then Last Name)
 */
export function sortStudentsAlphabetically(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    // Primary sort: First Name (Tên chính)
    const firstNameCompare = a.firstName.localeCompare(b.firstName, 'vi', { sensitivity: 'base' });
    if (firstNameCompare !== 0) {
      return firstNameCompare;
    }
    // Secondary sort: Last Name (Họ & Tên đệm)
    const lastNameCompare = a.lastName.localeCompare(b.lastName, 'vi', { sensitivity: 'base' });
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    // Tertiary sort: Full Name
    return a.fullName.localeCompare(b.fullName, 'vi', { sensitivity: 'base' });
  });
}

/**
 * Format status to friendly Vietnamese string and badge style
 */
export function getStatusBadgeInfo(status: string) {
  switch (status) {
    case 'Co_Mat':
      return { label: 'Có mặt', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotClass: 'bg-emerald-500' };
    case 'Vang_P':
      return { label: 'Vắng có phép', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', dotClass: 'bg-amber-500' };
    case 'Vang_KP':
      return { label: 'Vắng không phép', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200', dotClass: 'bg-rose-500' };
    case 'Di_Muon':
      return { label: 'Đi muộn', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200', dotClass: 'bg-orange-500' };
    case 'Nghi_Om':
      return { label: 'Nghỉ ốm', badgeClass: 'bg-sky-100 text-sky-800 border-sky-200', dotClass: 'bg-sky-500' };
    default:
      return { label: 'Chưa điểm danh', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', dotClass: 'bg-slate-400' };
  }
}
