import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Clipboard,
  Download,
  Sparkles,
  ArrowRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { parseVietnameseName } from '../utils/vietnameseSort';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  onImportStudents: (imported: Student[], overwriteClass?: string) => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onImportStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preset'>('upload');
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [targetClass, setTargetClass] = useState<string>(selectedClass === 'ALL' ? '10A' : selectedClass);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
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
        'Lớp': targetClass,
        'Giáo viên chủ nhiệm': 'Cô Nguyễn Thị Hoa',
        'Chức vụ': 'Lớp trưởng',
        'Địa chỉ': '123 Đường Lê Lợi, TP. Hà Nội',
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
        'Lớp': targetClass,
        'Giáo viên chủ nhiệm': 'Cô Nguyễn Thị Hoa',
        'Chức vụ': 'Học sinh',
        'Địa chỉ': '456 Đường Nguyễn Trãi, TP. Hà Nội',
      },
      {
        'STT': 3,
        'Mã định danh Bộ GD&ĐT': '001201008293',
        'Họ và tên': 'Lê Hoàng Nam',
        'Ngày sinh': '2010-11-05',
        'Giới tính': 'Nam',
        'Họ tên Bố/Mẹ': 'Lê Minh Hoàng (Bố)',
        'Số điện thoại': '0903123456',
        'Khối': 'Khối 10',
        'Lớp': targetClass,
        'Giáo viên chủ nhiệm': 'Cô Nguyễn Thị Hoa',
        'Chức vụ': 'Bí thư',
        'Địa chỉ': '789 Đường Trần Hưng Đạo',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Mau');
    XLSX.writeFile(wb, `File_Mau_Danh_Sach_Hoc_Sinh_Lop_${targetClass}.xlsx`);
  };

  // Process raw JS objects array into Student array
  const processRawRows = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('File hoặc dữ liệu rỗng, không tìm thấy danh sách học sinh.');
      return;
    }

    // Try to locate header row if file has top title rows
    let validRows = rows;
    const sampleKeys = Object.keys(rows[0] || {});
    
    // If keys look like __EMPTY or numbers, try finding real data rows
    const studentsList: Student[] = [];

    rows.forEach((row, idx) => {
      // Find fullName value from various common column titles
      const fullName =
        row['Họ và tên'] ||
        row['Họ và Tên'] ||
        row['Họ Tên'] ||
        row['Họ và tên học sinh'] ||
        row['Tên học sinh'] ||
        row['Học sinh'] ||
        row['Tên HS'] ||
        row['Full Name'] ||
        row['Name'] ||
        row['Column3'] ||
        '';

      if (!fullName || String(fullName).trim() === '' || String(fullName).includes('Họ và tên')) {
        return; // Skip headers or empty rows
      }

      const cleanName = String(fullName).trim();
      const { firstName, lastName } = parseVietnameseName(cleanName);

      const code = String(
        row['Mã định danh Bộ GD&ĐT'] ||
        row['Mã định danh'] ||
        row['Mã học sinh'] ||
        row['Mã HS'] ||
        row['Mã định danh GD'] ||
        row['Code'] ||
        `001201${100000 + idx}`
      ).trim();

      const itemClass = String(
        row['Lớp'] || row['Tên lớp'] || row['Class'] || targetClass
      ).trim();

      const grade =
        row['Khối'] ||
        (itemClass.startsWith('11') ? 'Khối 11' : itemClass.startsWith('12') ? 'Khối 12' : 'Khối 10');

      const gender =
        String(row['Giới tính'] || row['Giới Tính'] || row['GT'] || '').toLowerCase().includes('nữ')
          ? 'Nữ'
          : 'Nam';

      const dob = String(row['Ngày sinh'] || row['Ngày Sinh'] || row['NS'] || '2010-01-01').trim();

      const parentName = String(
        row['Họ tên Bố/Mẹ'] ||
        row['Họ Tên Phụ Huynh'] ||
        row['Phụ Huynh'] ||
        row['Tên bố mẹ'] ||
        row['Bố/Mẹ'] ||
        `Phụ huynh em ${cleanName}`
      ).trim();

      const parentPhone = String(
        row['Số điện thoại'] ||
        row['SĐT Phụ Huynh'] ||
        row['SĐT'] ||
        row['Điện thoại'] ||
        row['SĐT Bố'] ||
        row['SĐT Mẹ'] ||
        '0912345678'
      ).trim();

      const homeroomTeacher = String(
        row['Giáo viên chủ nhiệm'] || row['Tên GVCN'] || row['GVCN'] || 'Cô Nguyễn Thị Hoa'
      ).trim();

      const role = String(row['Chức vụ'] || row['Chức Vụ'] || 'Học sinh').trim();
      const address = String(row['Địa chỉ'] || row['Địa Chỉ'] || '').trim();

      studentsList.push({
        id: `std_imp_${Date.now()}_${idx}`,
        code,
        fullName: cleanName,
        firstName,
        lastName,
        className: itemClass,
        grade,
        gender,
        dob,
        parentName,
        parentPhone,
        homeroomTeacher,
        role: role as any,
        status: 'Đang học',
        address,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${code}`,
      });
    });

    if (studentsList.length === 0) {
      setErrorMessage('Không nhận diện được tên học sinh trong file. Vui lòng kiểm tra lại cột "Họ và tên".');
    } else {
      setErrorMessage('');
      setParsedStudents(studentsList);
    }
  };

  // Read Excel / CSV File via ArrayBuffer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Parse sheet to json
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        processRawRows(data);
      } catch (err: any) {
        console.error(err);
        setErrorMessage('Lỗi khi đọc file Excel. Vui lòng thử lưu lại dưới dạng file .xlsx chuẩn.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Không thể đọc file. Vui lòng thử lại!');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Parse Pasted Text (Tab/Comma separated lines)
  const handlePasteProcess = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Vui lòng dán văn bản danh sách học sinh vào ô bên dưới!');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const lines = pasteText.split('\n').filter((l) => l.trim().length > 0);
      const parsedRows: any[] = [];

      lines.forEach((line) => {
        // split by tab or comma or multiple spaces
        const parts = line.includes('\t')
          ? line.split('\t')
          : line.includes(',')
          ? line.split(',')
          : line.split(';');

        if (parts.length >= 2) {
          // Check if first part is index number
          let nameIndex = 0;
          let codeIndex = -1;

          if (!isNaN(Number(parts[0].trim()))) {
            nameIndex = 1;
            if (parts.length >= 3 && parts[1].length > 6) {
              codeIndex = 1;
              nameIndex = 2;
            }
          }

          const fullName = parts[nameIndex]?.trim() || '';
          if (fullName && !fullName.toLowerCase().includes('họ và tên')) {
            parsedRows.push({
              'Họ và tên': fullName,
              'Mã định danh Bộ GD&ĐT': codeIndex >= 0 ? parts[codeIndex]?.trim() : '',
              'Lớp': targetClass,
              'Số điện thoại': parts[parts.length - 1]?.trim() || '0912345678',
            });
          }
        }
      });

      if (parsedRows.length > 0) {
        processRawRows(parsedRows);
      } else {
        setErrorMessage('Không thể phân tích dữ liệu dán. Vui lòng dán từng hàng theo dạng: [STT] [Họ và Tên] [SĐT]');
      }
    } catch (e) {
      setErrorMessage('Lỗi phân tích dữ liệu dán!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Preset Sample Import for quick testing
  const handleLoadPresetSample = (presetClass: string) => {
    const samples: Student[] = [
      {
        id: `std_imp_preset_1`,
        code: '001201009901',
        fullName: 'Bùi Đức Cường',
        firstName: 'Cường',
        lastName: 'Bùi Đức',
        className: presetClass,
        grade: presetClass.startsWith('11') ? 'Khối 11' : 'Khối 10',
        gender: 'Nam',
        dob: '2010-04-12',
        parentName: 'Bùi Văn Hùng (Bố)',
        parentPhone: '0912888999',
        homeroomTeacher: 'Cô Nguyễn Thị Hoa',
        role: 'Lớp phó',
        status: 'Đang học',
        address: '12 Khâm Thiên, Đống Đa, Hà Nội',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=001201009901',
      },
      {
        id: `std_imp_preset_2`,
        code: '001201009902',
        fullName: 'Đỗ Thảo Nguyên',
        firstName: 'Nguyên',
        lastName: 'Đỗ Thảo',
        className: presetClass,
        grade: presetClass.startsWith('11') ? 'Khối 11' : 'Khối 10',
        gender: 'Nữ',
        dob: '2010-09-25',
        parentName: 'Đỗ Hoàng Anh (Bố)',
        parentPhone: '0987111222',
        homeroomTeacher: 'Cô Nguyễn Thị Hoa',
        role: 'Học sinh',
        status: 'Đang học',
        address: '88 Nguyễn Chí Thanh, Cầu Giấy',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=001201009902',
      },
      {
        id: `std_imp_preset_3`,
        code: '001201009903',
        fullName: 'Phạm Minh Nhật',
        firstName: 'Nhật',
        lastName: 'Phạm Minh',
        className: presetClass,
        grade: presetClass.startsWith('11') ? 'Khối 11' : 'Khối 10',
        gender: 'Nam',
        dob: '2010-01-18',
        parentName: 'Phạm Thanh Sơn (Bố)',
        parentPhone: '0904333444',
        homeroomTeacher: 'Cô Nguyễn Thị Hoa',
        role: 'Lớp trưởng',
        status: 'Đang học',
        address: '24 Láng Hạ, Đống Đa',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=001201009903',
      },
    ];

    setTargetClass(presetClass);
    setParsedStudents(samples);
    setErrorMessage('');
  };

  // Submit to Parent Handler
  const handleConfirmImport = () => {
    if (parsedStudents.length === 0) return;

    // Apply targetClass override if specified
    const updatedWithTargetClass = parsedStudents.map((s) => ({
      ...s,
      className: targetClass,
      grade: targetClass.startsWith('11') ? 'Khối 11' : targetClass.startsWith('12') ? 'Khối 12' : 'Khối 10',
    }));

    onImportStudents(updatedWithTargetClass, importMode === 'replace' ? targetClass : undefined);
    alert(`Đã nhập thành công ${updatedWithTargetClass.length} học sinh vào Lớp ${targetClass}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nhập Danh Sách Học Sinh Từ Excel</h3>
                <p className="text-xs text-slate-500">Tải file .xlsx / .csv hoặc dán danh sách trực tiếp</p>
              </div>
            </div>
            <button
              id="btn-close-import-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 my-4 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              id="tab-import-upload"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1. Tải File Excel (.xlsx)</span>
            </button>

            <button
              id="tab-import-paste"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'paste' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>2. Dán Văn Bản Trực Tiếp</span>
            </button>

            <button
              id="tab-import-preset"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'preset' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Nạp Danh Sách Mẫu</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-4">
          
          {/* Target Class Selection */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-900">Lớp tiếp nhận dữ liệu:</span>
              <select
                id="select-import-target-class"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="px-3 py-1 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-48"
              >
                <optgroup label="Khối 10 (10A - 10I)">
                  {['10A', '10B', '10C', '10D', '10E', '10F', '10G', '10H', '10I'].map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Khối 11 (11A - 11I)">
                  {['11A', '11B', '11C', '11D', '11E', '11F', '11G', '11H', '11I'].map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Khối 12 (12A - 12I)">
                  {['12A', '12B', '12C', '12D', '12E', '12F', '12G', '12H', '12I'].map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              id="btn-download-modal-sample"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tải mẫu File Excel chuẩn (.xlsx)</span>
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 transition-all rounded-3xl p-6 text-center cursor-pointer relative">
                <input
                  type="file"
                  id="input-file-excel-upload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây hoặc kéo thả file Excel / CSV vào đây'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hỗ trợ định dạng .xlsx, .xls, .csv từ vnEdu, SMAS hoặc Excel cá nhân
                </p>
              </div>

              {isProcessing && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Đang phân tích cấu trúc dữ liệu file Excel...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Dán dữ liệu từ Excel / Word / Google Sheets vào đây... (mỗi học sinh 1 dòng)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                id="btn-process-pasted-text"
                onClick={handlePasteProcess}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Phân tích dữ liệu văn bản đã dán</span>
              </button>
            </div>
          )}

          {/* TAB 3: Preset Sample Lists */}
          {activeTab === 'preset' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Chọn nhanh lớp mẫu thử nghiệm:</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['10A', '10I', '11A', '11I', '12A', '12I'].map((cls) => (
                  <button
                    key={cls}
                    id={`btn-preset-import-${cls}`}
                    onClick={() => handleLoadPresetSample(cls)}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-2xl text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Lớp {cls}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">3 Học sinh mẫu</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Đã đọc thành công {parsedStudents.length} học sinh
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Thêm tiếp nối</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Làm mới danh sách Lớp {targetClass}</span>
                  </label>
                </div>
              </div>

              {/* Preview Table Container */}
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 border-b">STT</th>
                      <th className="p-2 border-b">Họ và Tên</th>
                      <th className="p-2 border-b">Mã GD&ĐT</th>
                      <th className="p-2 border-b">Giới tính</th>
                      <th className="p-2 border-b">Lớp</th>
                      <th className="p-2 border-b">SĐT Phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {parsedStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{s.fullName}</td>
                        <td className="p-2 font-mono text-slate-600">{s.code}</td>
                        <td className="p-2">{s.gender}</td>
                        <td className="p-2 font-semibold text-blue-700">{s.className}</td>
                        <td className="p-2 font-mono">{s.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            id="btn-confirm-import-students"
            disabled={parsedStudents.length === 0}
            onClick={handleConfirmImport}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
              parsedStudents.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Xác nhận Nhập {parsedStudents.length} Học Sinh</span>
          </button>
        </div>

      </div>
    </div>
  );
};
