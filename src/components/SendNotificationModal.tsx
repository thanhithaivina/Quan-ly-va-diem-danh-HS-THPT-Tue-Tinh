import React, { useState } from 'react';
import { X, Send, MessageSquare, Phone, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface SendNotificationModalProps {
  student: Student;
  statusType: 'Vang_KP' | 'Vang_P' | 'Di_Muon' | 'Co_Mat';
  defaultReason?: string;
  onClose: () => void;
  onConfirmSend: (student: Student, channel: 'Zalo' | 'SMS', message: string) => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  student,
  statusType,
  defaultReason,
  onClose,
  onConfirmSend,
}) => {
  const [channel, setChannel] = useState<'Zalo' | 'SMS'>('Zalo');
  const todayStr = new Date().toLocaleDateString('vi-VN');

  const getInitialMessage = () => {
    if (statusType === 'Vang_KP') {
      return `Trường THPT Tuệ Tĩnh xin thông báo: Học sinh ${student.fullName} (Lớp ${student.className}) vắng mặt không phép vào ngày ${todayStr}. Kính đề nghị Phụ huynh (${student.parentName}) liên hệ gấp với Giáo viên bộ môn / Chủ nhiệm để phối hợp.`;
    } else if (statusType === 'Vang_P') {
      return `Trường THPT Tuệ Tĩnh: Nhà trường đã ghi nhận đơn xin nghỉ phép của học sinh ${student.fullName} (Lớp ${student.className}) vào ngày ${todayStr}${defaultReason ? `. Lý do: ${defaultReason}` : ''}. Chúc em sớm trở lại lớp học!`;
    } else if (statusType === 'Di_Muon') {
      return `Trường THPT Tuệ Tĩnh: Học sinh ${student.fullName} Lớp ${student.className} đi muộn vào ngày ${todayStr}. Rất mong Phụ huynh (${student.parentName}) nhắc nhở em đi học đúng giờ.`;
    } else {
      return `Kính gửi Phụ huynh em ${student.fullName} Lớp ${student.className}: Hôm nay em đi học đầy đủ và có thái độ học tập rất tốt. Trân trọng!`;
    }
  };

  const [messageText, setMessageText] = useState(getInitialMessage());
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = () => {
    const cleaned = student.parentPhone.replace(/\D/g, '');
    
    // Copy content to clipboard so user can press Ctrl+V in Zalo
    try {
      navigator.clipboard.writeText(messageText);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }

    if (channel === 'Zalo') {
      const zaloUrl = `https://zalo.me/${cleaned}`;
      window.open(zaloUrl, '_blank');
    } else if (channel === 'SMS') {
      const smsUrl = `sms:${cleaned}?body=${encodeURIComponent(messageText)}`;
      window.open(smsUrl, '_blank');
    }

    onConfirmSend(student, channel, messageText);
    setSentSuccess(true);
  };

  const handleOpenZaloDirect = () => {
    const cleaned = student.parentPhone.replace(/\D/g, '');
    try {
      navigator.clipboard.writeText(messageText);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
    window.open(`https://zalo.me/${cleaned}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gửi Thông Báo Vắng Mặt / Muộn</h3>
              <p className="text-xs text-slate-500">Học sinh: {student.fullName} ({student.code})</p>
            </div>
          </div>

          <button
            id="btn-close-send-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 px-2 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900">Đã kích hoạt gửi tin nhắn thành công!</h4>
              <p className="text-xs text-slate-600 mt-1">
                Nội dung đã được ghi nhận trong nhật ký & sao chép vào bộ nhớ tạm.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-left text-slate-700 space-y-2">
              <p className="font-bold text-blue-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Hướng dẫn hoàn tất gửi Zalo:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Nội dung tin nhắn đã được <strong>tự động sao chép (Ctrl+V)</strong>.</li>
                <li>SĐT phụ huynh: <strong className="text-blue-700">{student.parentPhone}</strong></li>
                <li>Nếu cửa sổ Zalo chưa tự mở, vui lòng bấm vào nút bên dưới:</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <a
                href={`https://zalo.me/${student.parentPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở Zalo tới {student.parentPhone}</span>
              </a>

              <button
                type="button"
                id="btn-close-success-modal"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Parent Info */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs space-y-1">
              <p className="text-slate-600">Phụ huynh nhận tin: <strong className="text-slate-900">{student.parentName}</strong></p>
              <p className="text-slate-600">Số điện thoại Zalo/SMS: <strong className="text-blue-700 font-bold">{student.parentPhone}</strong></p>
            </div>

            {/* Select Channel */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Chọn kênh truyền thông báo:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-select-channel-zalo"
                  onClick={() => setChannel('Zalo')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    channel === 'Zalo'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Zalo Official Account</span>
                </button>

                <button
                  type="button"
                  id="btn-select-channel-sms"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    channel === 'SMS'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>SMS Brandname</span>
                </button>
              </div>
            </div>

            {/* Message Text Editor */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nội dung tin nhắn chỉnh sửa:
              </label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                id="btn-open-zalo-app-direct"
                onClick={handleOpenZaloDirect}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Mở Chat Zalo trực tiếp</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="btn-cancel-send-modal"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  id="btn-confirm-send-modal"
                  onClick={handleSend}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi tin ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
