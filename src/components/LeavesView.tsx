import React, { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Calendar,
  Phone,
  User,
  X,
  FileCheck,
  MessageSquare,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { AbsenceLeave, Student } from '../types';

interface LeavesViewProps {
  leaves: AbsenceLeave[];
  students: Student[];
  selectedClass: string;
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string, reason?: string) => void;
  onCreateLeave: (newLeave: AbsenceLeave) => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  leaves,
  students,
  selectedClass,
  onApproveLeave,
  onRejectLeave,
  onCreateLeave,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [requestedBy, setRequestedBy] = useState('');

  // Zalo Message Simulation State
  const [zaloMessageInput, setZaloMessageInput] = useState(
    'Chào cô Hoa, em là mẹ của cháu Bùi Đức Cường lớp 10A. Hôm nay cháu bị sốt cao nên gia đình xin phép cô cho cháu nghỉ học ngày hôm nay. Cảm ơn cô!'
  );

  const classStudents = students.filter((s) => selectedClass === 'ALL' || s.className === selectedClass);

  const filteredLeaves = leaves.filter((l) => {
    const matchesClass = selectedClass === 'ALL' || l.className === selectedClass;
    const matchesSearch =
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.parentPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesClass && matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student || !reason.trim()) {
      alert('Vui lòng chọn học sinh và nhập lý do xin nghỉ phép!');
      return;
    }

    const newLeave: AbsenceLeave = {
      id: `leave_${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      fromDate,
      toDate,
      periods: [1, 2, 3, 4, 5],
      reason,
      requestedBy: requestedBy || `Phụ huynh em ${student.fullName}`,
      parentPhone: student.parentPhone,
      source: 'Thủ công',
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString(),
    };

    onCreateLeave(newLeave);
    setIsModalOpen(false);
    setReason('');
  };

  // Process Incoming Zalo Message to Teacher
  const handleProcessZaloMessage = (msgText: string) => {
    if (!msgText.trim()) return;

    // Smart matching: Find student whose name is in msgText
    const matchedStudent = students.find((s) =>
      msgText.toLowerCase().includes(s.fullName.toLowerCase()) ||
      msgText.toLowerCase().includes(s.firstName.toLowerCase())
    ) || classStudents[0] || students[0];

    const todayStr = new Date().toISOString().split('T')[0];

    // Extract reason or use fallback
    let detectedReason = 'Xin nghỉ phép qua tin nhắn Zalo gửi GV';
    if (msgText.toLowerCase().includes('sốt')) detectedReason = 'Bị sốt cao, khám bệnh';
    else if (msgText.toLowerCase().includes('ốm')) detectedReason = 'Bị ốm, mệt mỏi';
    else if (msgText.toLowerCase().includes('việc gia đình') || msgText.toLowerCase().includes('việc nhà')) detectedReason = 'Gia đình có việc bận đột xuất';

    const newZaloLeave: AbsenceLeave = {
      id: `leave_zalo_${Date.now()}`,
      studentId: matchedStudent ? matchedStudent.id : 'std_1',
      studentName: matchedStudent ? matchedStudent.fullName : 'Nguyễn Văn An',
      className: matchedStudent ? matchedStudent.className : '10A',
      fromDate: todayStr,
      toDate: todayStr,
      periods: [1, 2, 3, 4, 5],
      reason: detectedReason,
      requestedBy: matchedStudent ? matchedStudent.parentName : 'Phụ huynh học sinh',
      parentPhone: matchedStudent ? matchedStudent.parentPhone : '0912345678',
      source: 'Zalo',
      rawZaloMessage: msgText,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString(),
    };

    onCreateLeave(newZaloLeave);
    setIsZaloModalOpen(false);
    alert(`Đã nhận tin nhắn Zalo & tạo đơn xin nghỉ phép thành công cho em ${newZaloLeave.studentName}!`);
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
            <span className="text-xs text-blue-600 font-bold flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Tích hợp Zalo Nhận Tin Nhắn Nghỉ Phép</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Quản Lý Đơn Xin Nghỉ Phép ({filteredLeaves.length} đơn)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Receive Zalo Message Button */}
          <button
            id="btn-receive-zalo-leave"
            onClick={() => setIsZaloModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs transition-all shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Nhận tin nhắn Zalo Phụ huynh</span>
          </button>

          <button
            id="btn-create-leave-modal"
            onClick={() => {
              if (classStudents.length > 0) setSelectedStudentId(classStudents[0].id);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo đơn nghỉ mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-leaves-search"
            type="text"
            placeholder="Tìm theo tên học sinh, lý do, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1 text-xs">
          {['ALL', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'].map((st) => (
            <button
              key={st}
              id={`btn-filter-leave-${st}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'Tất cả trạng thái' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Request List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLeaves.map((leave) => (
          <div
            key={leave.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-base">{leave.studentName}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-md">
                    Lớp {leave.className}
                  </span>
                  {leave.source === 'Zalo' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span>Từ Zalo</span>
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    leave.status === 'Đã duyệt'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : leave.status === 'Từ chối'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}
                >
                  {leave.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>
                    Thời gian: <strong className="text-slate-900">{leave.fromDate}</strong> đến{' '}
                    <strong className="text-slate-900">{leave.toDate}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Người xin: <strong className="text-slate-800">{leave.requestedBy}</strong> ({leave.parentPhone})</span>
                  </div>
                  <a
                    href={`https://zalo.me/${leave.parentPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 flex items-center space-x-1 shrink-0 transition-colors"
                    title={`Mở Zalo nhắn tới SĐT ${leave.parentPhone}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Zalo PH</span>
                  </a>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                  <p className="text-slate-400 font-semibold mb-0.5">Lý do xin nghỉ:</p>
                  <p className="text-slate-800 italic font-medium">"{leave.reason}"</p>
                  {leave.rawZaloMessage && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-blue-900 bg-blue-50/60 p-2 rounded-lg">
                      <span className="font-bold text-blue-700 block mb-0.5">💬 Nội dung tin nhắn Zalo nhận được:</span>
                      "{leave.rawZaloMessage}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {leave.status === 'Chờ duyệt' ? (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  id={`btn-reject-leave-${leave.id}`}
                  onClick={() => onRejectLeave(leave.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
                <button
                  id={`btn-approve-leave-${leave.id}`}
                  onClick={() => onApproveLeave(leave.id)}
                  className="flex items-center space-x-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Duyệt đơn này</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 text-right text-[11px] text-slate-400 italic">
                {leave.approvedBy ? `Đã xử lý bởi ${leave.approvedBy}` : 'Đã hoàn tất xử lý'}
              </div>
            )}
          </div>
        ))}

        {filteredLeaves.length === 0 && (
          <div className="col-span-2 bg-white rounded-2xl p-12 text-center text-slate-500 text-sm border border-slate-200">
            🎉 Không có đơn xin nghỉ phép nào phù hợp với bộ lọc!
          </div>
        )}
      </div>

      {/* Receive Zalo Message Modal */}
      {isZaloModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Nhận Tin Nhắn Zalo Từ Phụ Huynh</h3>
                  <p className="text-xs text-slate-500">Mô phỏng tin nhắn xin nghỉ gửi trực tiếp tới Zalo GV</p>
                </div>
              </div>
              <button
                id="btn-close-zalo-modal"
                onClick={() => setIsZaloModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nội dung tin nhắn Zalo gửi đến:
                </label>
                <textarea
                  rows={4}
                  value={zaloMessageInput}
                  onChange={(e) => setZaloMessageInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dán nội dung tin nhắn Zalo từ phụ huynh..."
                />
              </div>

              {/* Sample Zalo Prompts */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Chọn mẫu tin nhắn Zalo mẫu:</p>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => setZaloMessageInput('Chào cô, em là phụ huynh cháu Nguyễn Văn An 10A. Hôm nay cháu An bị cảm lạnh sốt nhẹ, xin phép cô cho cháu nghỉ học buổi sáng hôm nay.')}
                    className="w-full text-left p-2 bg-slate-100 hover:bg-blue-50 text-slate-800 rounded-lg border border-slate-200 transition-colors"
                  >
                    💡 "Cháu Nguyễn Văn An 10A bị cảm lạnh xin nghỉ..."
                  </button>
                  <button
                    onClick={() => setZaloMessageInput('Dạ thưa thầy, em là mẹ của Bùi Đức Cường. Cháu Cường bị đau bụng đi khám bệnh viện nên xin phép thầy cho nghỉ 1 ngày.')}
                    className="w-full text-left p-2 bg-slate-100 hover:bg-blue-50 text-slate-800 rounded-lg border border-slate-200 transition-colors"
                  >
                    💡 "Cháu Bùi Đức Cường đi khám bệnh viện..."
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsZaloModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  id="btn-process-zalo-submit"
                  onClick={() => handleProcessZaloMessage(zaloMessageInput)}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tự động trích xuất & Tạo đơn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Tạo Đơn Xin Nghỉ Phép Mới</h3>
              <button
                id="btn-close-leave-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn Học Sinh:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - Lớp {s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Từ ngày:</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Đến ngày:</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Người làm đơn (Phụ huynh):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bố em Nguyễn Văn An"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Lý do xin nghỉ chi tiết:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do (ốm sốt, khám bệnh, việc gia đình...)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  id="btn-cancel-leave-modal"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-leave-modal"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  Gửi đơn xin nghỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
