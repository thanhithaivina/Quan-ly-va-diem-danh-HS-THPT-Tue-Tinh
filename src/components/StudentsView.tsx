import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, Gender, StudentRole } from '../types';
import { sortStudentsAlphabetically, parseVietnameseName } from '../utils/vietnameseSort';
import { ImportStudentsModal } from './ImportStudentsModal';

interface StudentsViewProps {
  students: Student[];
  selectedClass: string;
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (updated: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteStudents?: (ids: string[]) => void;
  onImportStudents: (imported: Student[], overwriteClass?: string) => void;
}

const CLASS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const GRADES = ['Khối 10', 'Khối 11', 'Khối 12'];

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  selectedClass,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteStudents,
  onImportStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'batch';
    student?: Student;
    ids?: string[];
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    fullName: string;
    grade: string;
    classLetter: string;
    gender: Gender;
    dob: string;
    parentName: string;
    parentPhone: string;
    homeroomTeacher: string;
    parentEmail: string;
    role: StudentRole;
    address: string;
  }>({
    code: '',
    fullName: '',
    grade: 'Khối 10',
    classLetter: 'A',
    gender: 'Nam',
    dob: '2010-01-01',
    parentName: '',
    parentPhone: '',
    homeroomTeacher: 'Cô Nguyễn Thị Hoa',
    parentEmail: '',
    role: 'Học sinh',
    address: '',
  });

  // Filter & Sort A-Z by Vietnamese Name
  const classStudents = sortStudentsAlphabetically(
    students.filter((s) => {
      const matchesClass = selectedClass === 'ALL' || s.className === selectedClass;
      const matchesGradeFilter = gradeFilter === 'ALL' || s.grade === gradeFilter;
      return matchesClass && matchesGradeFilter;
    })
  );

  const filteredStudents = classStudents.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.includes(searchTerm) ||
      (s.homeroomTeacher && s.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Batch Selection & Deletion Helpers
  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s.id));

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const filteredIds = filteredStudents.map((s) => s.id);
      const newSelected = new Set([...selectedStudentIds, ...filteredIds]);
      setSelectedStudentIds(Array.from(newSelected));
    }
  };

  const handleBatchDelete = () => {
    if (selectedStudentIds.length === 0) return;
    setDeleteConfirmTarget({ type: 'batch', ids: [...selectedStudentIds] });
  };

  const handleSingleDelete = (student: Student) => {
    setDeleteConfirmTarget({ type: 'single', student });
  };

  const executeDelete = () => {
    if (!deleteConfirmTarget) return;
    if (deleteConfirmTarget.type === 'single' && deleteConfirmTarget.student) {
      const studentId = deleteConfirmTarget.student.id;
      onDeleteStudent(studentId);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    } else if (deleteConfirmTarget.type === 'batch' && deleteConfirmTarget.ids) {
      if (onDeleteStudents) {
        onDeleteStudents(deleteConfirmTarget.ids);
      } else {
        deleteConfirmTarget.ids.forEach((id) => onDeleteStudent(id));
      }
      setSelectedStudentIds([]);
    }
    setDeleteConfirmTarget(null);
  };

  // Modal handlers
  const handleOpenAdd = () => {
    const defaultGrade = selectedClass.startsWith('11')
      ? 'Khối 11'
      : selectedClass.startsWith('12')
      ? 'Khối 12'
      : 'Khối 10';
    const letter = selectedClass.slice(-1);
    const defaultLetter = CLASS_LETTERS.includes(letter) ? letter : 'A';

    setFormData({
      code: `0012010${Math.floor(Math.random() * 800000 + 100000)}`,
      fullName: '',
      grade: defaultGrade,
      classLetter: defaultLetter,
      gender: 'Nam',
      dob: '2010-01-01',
      parentName: '',
      parentPhone: '',
      homeroomTeacher: 'Cô Nguyễn Thị Hoa',
      parentEmail: '',
      role: 'Học sinh',
      address: '',
    });
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    const gradeVal = student.grade || (student.className.startsWith('11') ? 'Khối 11' : student.className.startsWith('12') ? 'Khối 12' : 'Khối 10');
    const letter = student.className.slice(-1) || 'A';

    setFormData({
      code: student.code,
      fullName: student.fullName,
      grade: gradeVal,
      classLetter: letter,
      gender: student.gender,
      dob: student.dob,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      homeroomTeacher: student.homeroomTeacher || 'Cô Nguyễn Thị Hoa',
      parentEmail: student.parentEmail || '',
      role: student.role,
      address: student.address || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.parentPhone.trim() || !formData.code.trim()) {
      alert('Vui lòng điền đầy đủ Mã định danh Bộ GD&ĐT, Họ tên học sinh và Số điện thoại phụ huynh!');
      return;
    }

    const { firstName, lastName } = parseVietnameseName(formData.fullName);
    const gradeNum = formData.grade === 'Khối 11' ? '11' : formData.grade === 'Khối 12' ? '12' : '10';
    const fullClassName = `${gradeNum}${formData.classLetter}`;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        code: formData.code,
        fullName: formData.fullName,
        grade: formData.grade,
        className: fullClassName,
        gender: formData.gender,
        dob: formData.dob,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        homeroomTeacher: formData.homeroomTeacher,
        parentEmail: formData.parentEmail,
        role: formData.role,
        address: formData.address,
        firstName,
        lastName,
      });
    } else {
      const newStd: Student = {
        id: `std_${Date.now()}`,
        code: formData.code,
        fullName: formData.fullName,
        grade: formData.grade,
        className: fullClassName,
        gender: formData.gender,
        dob: formData.dob,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        homeroomTeacher: formData.homeroomTeacher,
        parentEmail: formData.parentEmail,
        role: formData.role,
        address: formData.address,
        firstName,
        lastName,
        status: 'Đang học',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.code}`,
      };
      onAddStudent(newStd);
    }

    setIsAddModalOpen(false);
  };

  // Export student list to Excel
  const handleExportExcel = () => {
    const rows = filteredStudents.map((s, idx) => ({
      'STT': idx + 1,
      'Mã định danh Bộ GD&ĐT': s.code,
      'Họ và tên': s.fullName,
      'Ngày sinh': s.dob,
      'Giới tính': s.gender,
      'Họ tên Bố/Mẹ': s.parentName,
      'Số điện thoại': s.parentPhone,
      'Khối': s.grade || 'Khối 10',
      'Lớp': s.className,
      'Giáo viên chủ nhiệm': s.homeroomTeacher || 'Cô Nguyễn Thị Hoa',
      'Chức vụ': s.role,
      'Địa chỉ': s.address || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Học Sinh');
    XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${selectedClass}_Full.xlsx`);
  };

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      {
        'STT': 1,
        'Mã định danh Bộ GD&ĐT': '001201008291',
        'Họ và tên': 'Nguyễn Văn An',
        'Ngày sinh': '2010-03-15',
        'Giới tính': 'Nam',
        'Họ tên Bố/Mẹ': 'Nguyễn Văn Bình (Bố)',
        'Số điện thoại': '0912345678',
        'Khối': 'Khối 10',
        'Lớp': '10A',
        'Giáo viên chủ nhiệm': 'Cô Nguyễn Thị Hoa',
      },
      {
        'STT': 2,
        'Mã định danh Bộ GD&ĐT': '001201008292',
        'Họ và tên': 'Trần Thị Bảo An',
        'Ngày sinh': '2010-07-20',
        'Giới tính': 'Nữ',
        'Họ tên Bố/Mẹ': 'Trần Quốc Bảo (Bố)',
        'Số điện thoại': '0987654321',
        'Khối': 'Khối 10',
        'Lớp': '10A',
        'Giáo viên chủ nhiệm': 'Cô Nguyễn Thị Hoa',
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Import');
    XLSX.writeFile(wb, 'File_Mau_Danh_Sach_Hoc_Sinh.xlsx');
  };

  // Import Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const importedList: Student[] = data.map((row, idx) => {
          const fullName = row['Họ và tên'] || row['Họ và Tên'] || row['Họ Tên'] || 'Học sinh';
          const { firstName, lastName } = parseVietnameseName(fullName);
          const code = String(row['Mã định danh Bộ GD&ĐT'] || row['Mã định danh'] || row['Mã Học Sinh'] || row['Mã HS'] || `001201${100000 + idx}`);
          const className = String(row['Lớp'] || selectedClass || '10A');
          const grade = row['Khối'] || (className.startsWith('11') ? 'Khối 11' : className.startsWith('12') ? 'Khối 12' : 'Khối 10');

          return {
            id: `std_imp_${Date.now()}_${idx}`,
            code,
            fullName,
            firstName,
            lastName,
            className,
            grade,
            gender: row['Giới tính'] === 'Nữ' || row['Giới Tính'] === 'Nữ' ? 'Nữ' : 'Nam',
            dob: row['Ngày sinh'] || row['Ngày Sinh'] || '2010-01-01',
            parentName: row['Họ tên Bố/Mẹ'] || row['Họ Tên Phụ Huynh'] || row['Phụ Huynh'] || 'Phụ huynh',
            parentPhone: String(row['Số điện thoại'] || row['SĐT Phụ Huynh'] || row['SĐT'] || '0900000000'),
            homeroomTeacher: row['Giáo viên chủ nhiệm'] || row['Tên giáo viên chủ nhiệm'] || 'Cô Nguyễn Thị Hoa',
            parentEmail: row['Email PH'] || '',
            role: row['Chức vụ'] || row['Chức Vụ'] || 'Học sinh',
            status: 'Đang học',
            address: row['Địa chỉ'] || row['Địa Chỉ'] || '',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${code}`,
          };
        });

        onImportStudents(importedList);
        alert(`Đã nhập thành công ${importedList.length} học sinh từ file Excel!`);
      } catch (err) {
        console.error(err);
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra các cột thông tin.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase">
              {selectedClass === 'ALL' ? 'Tất cả các lớp' : `Lớp ${selectedClass}`}
            </span>
            <span className="text-xs text-slate-500 font-medium">Sắp xếp A-Z tự động • Quản lý thông tin Bộ GD&ĐT</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Danh Sách Học Sinh ({filteredStudents.length} học sinh)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Student Button */}
          <button
            id="btn-add-student-modal"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học sinh mới</span>
          </button>

          {/* Download Sample Excel */}
          <button
            id="btn-download-sample-excel"
            onClick={handleDownloadSampleExcel}
            className="flex items-center space-x-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition-colors"
            title="Tải mẫu Excel đúng định dạng"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Mẫu Excel</span>
          </button>

          {/* Export Excel */}
          <button
            id="btn-export-students-excel"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-200 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            id="btn-open-import-modal"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Nhập Excel / File</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-students-search"
            type="text"
            placeholder="Tìm theo tên, Mã định danh, SĐT, GVCN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium mr-1">Khối:</span>
            {['ALL', 'Khối 10', 'Khối 11', 'Khối 12'].map((g) => (
              <button
                key={g}
                id={`btn-filter-grade-${g}`}
                onClick={() => setGradeFilter(g)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  gradeFilter === g
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === 'ALL' ? 'Tất cả' : g}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-medium mr-1">Giới tính:</span>
            {['ALL', 'Nam', 'Nữ'].map((g) => (
              <button
                key={g}
                id={`btn-filter-gender-${g}`}
                onClick={() => setGenderFilter(g)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  genderFilter === g
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === 'ALL' ? 'Tất cả' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Actions Bar if any students selected */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              {selectedStudentIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-rose-900">
                Đã chọn {selectedStudentIds.length} / {filteredStudents.length} học sinh
              </p>
              <p className="text-[11px] text-rose-600 font-medium">
                Tích chọn học sinh cần xóa khỏi danh sách lớp
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-clear-selection"
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              id="btn-batch-delete-students"
              onClick={handleBatchDelete}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedStudentIds.length} học sinh đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Student Table - Strictly Matches Required Columns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10 border-r border-slate-700">
                  <input
                    type="checkbox"
                    id="checkbox-select-all-students"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    title="Chọn tất cả / Bỏ chọn tất cả"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3 px-3 text-center w-12 border-r border-slate-700">STT</th>
                <th className="py-3 px-3 border-r border-slate-700 min-w-[150px]">Mã định danh Bộ GD&ĐT</th>
                <th className="py-3 px-4 border-r border-slate-700 min-w-[180px]">Họ và tên</th>
                <th className="py-3 px-3 border-r border-slate-700 text-center min-w-[110px]">Ngày sinh</th>
                <th className="py-3 px-3 border-r border-slate-700 text-center w-20">Giới tính</th>
                <th className="py-3 px-4 border-r border-slate-700 min-w-[160px]">Họ tên Bố/Mẹ</th>
                <th className="py-3 px-3 border-r border-slate-700 min-w-[130px]">Số điện thoại (Zalo)</th>
                <th className="py-3 px-3 border-r border-slate-700 text-center min-w-[100px]">Khối / Lớp</th>
                <th className="py-3 px-3 border-r border-slate-700 min-w-[150px]">Giáo viên chủ nhiệm</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredStudents.map((student, idx) => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <tr
                    key={student.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-blue-50/30'
                    }`}
                  >
                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        id={`checkbox-student-${student.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleSelectStudent(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3 font-bold text-blue-700 border-r border-slate-100 font-mono tracking-tight">
                      {student.code}
                    </td>

                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.code}`}
                          alt={student.fullName}
                          className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{student.fullName}</p>
                          {student.role !== 'Học sinh' && (
                            <span className="inline-block text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold mt-0.5">
                              {student.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center text-slate-700 font-medium border-r border-slate-100 whitespace-nowrap">
                      {student.dob}
                    </td>

                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        student.gender === 'Nam' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {student.gender}
                      </span>
                    </td>

                    <td className="py-3 px-4 border-r border-slate-100 font-medium text-slate-800">
                      {student.parentName}
                    </td>

                    <td className="py-3 px-3 border-r border-slate-100">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center space-x-1 font-bold text-blue-600">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{student.parentPhone}</span>
                        </div>
                        <a
                          href={`https://zalo.me/${student.parentPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-md transition-colors shrink-0 shadow-xs"
                          title={`Mở Zalo tới phụ huynh ${student.parentName}`}
                        >
                          Zalo
                        </a>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center border-r border-slate-100">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {student.className}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{student.grade || 'Khối 10'}</p>
                    </td>

                    <td className="py-3 px-3 border-r border-slate-100 font-medium text-slate-700">
                      {student.homeroomTeacher || 'Cô Nguyễn Thị Hoa'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          id={`btn-edit-student-${student.id}`}
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-student-${student.id}`}
                          onClick={() => handleSingleDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-500 text-sm">
                    Không tìm thấy học sinh nào phù hợp!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới Vào Hệ Thống'}
              </h3>
              <button
                id="btn-close-student-modal"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Row 1: Grade & Class Name */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">1. Chọn Khối học:</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">2. Chọn Tên Lớp (A - I):</label>
                  <select
                    value={formData.classLetter}
                    onChange={(e) => setFormData({ ...formData, classLetter: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CLASS_LETTERS.map((l) => (
                      <option key={l} value={l}>Lớp {l} ({formData.grade === 'Khối 11' ? '11' : formData.grade === 'Khối 12' ? '12' : '10'}{l})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: MOET ID & Full name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mã định danh Bộ GD&ĐT:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00120100xxxx"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Họ và tên Học sinh:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: DOB & Gender */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chức vụ trong lớp:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StudentRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Học sinh">Học sinh</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó">Lớp phó</option>
                    <option value="Cán sự môn">Cán sự môn</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Parent info & Homeroom Teacher */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-blue-600 uppercase">Thông tin Phụ huynh & GVCN</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Họ tên Bố/Mẹ:</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn Bình (Bố)"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">SĐT Phụ huynh (Zalo):</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tên GV Chủ nhiệm:</label>
                    <input
                      type="text"
                      required
                      placeholder="Cô Nguyễn Thị Hoa"
                      value={formData.homeroomTeacher}
                      onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  id="btn-cancel-student-modal"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  id="btn-submit-student-modal"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedClass={selectedClass}
        onImportStudents={onImportStudents}
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {deleteConfirmTarget.type === 'single'
                    ? 'Xác nhận xóa học sinh'
                    : `Xác nhận xóa ${deleteConfirmTarget.ids?.length || 0} học sinh`}
                </h3>
                <p className="text-xs text-rose-600 font-medium">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-4 text-xs text-slate-700 leading-relaxed">
              {deleteConfirmTarget.type === 'single' && deleteConfirmTarget.student && (
                <p>
                  Bạn có chắc chắn muốn xóa học sinh{' '}
                  <strong className="text-slate-900">{deleteConfirmTarget.student.fullName}</strong> (Mã định danh:{' '}
                  <span className="font-mono text-blue-700 font-bold">{deleteConfirmTarget.student.code}</span>, Lớp:{' '}
                  <span className="font-bold">{deleteConfirmTarget.student.className}</span>) khỏi danh sách không?
                </p>
              )}
              {deleteConfirmTarget.type === 'batch' && (
                <p>
                  Bạn có chắc chắn muốn xóa <strong className="text-rose-700">{deleteConfirmTarget.ids?.length}</strong> học
                  sinh đã chọn khỏi danh sách không?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-modal"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-confirm-delete-modal"
                onClick={executeDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/25 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {deleteConfirmTarget.type === 'single'
                    ? 'Đồng ý xóa'
                    : `Xóa ${deleteConfirmTarget.ids?.length} học sinh`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

