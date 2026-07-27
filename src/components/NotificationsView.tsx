import React, { useState } from 'react';
import {
  MessageSquareText,
  Send,
  Sparkles,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Edit3,
  RotateCcw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { NotificationLog, NotificationChannelConfig, NotificationTemplate, Student } from '../types';

interface NotificationsViewProps {
  logs: NotificationLog[];
  configs: NotificationChannelConfig[];
  templates: NotificationTemplate[];
  students: Student[];
  onUpdateConfigs: (configs: NotificationChannelConfig[]) => void;
  onUpdateTemplates: (templates: NotificationTemplate[]) => void;
  onResendNotification: (log: NotificationLog) => void;
  onManualSendNotification: (student: Student, channel: 'Zalo' | 'SMS', message: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  logs,
  configs,
  templates,
  students,
  onUpdateConfigs,
  onUpdateTemplates,
  onResendNotification,
  onManualSendNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates' | 'channels' | 'ai_composer'>('logs');

  // AI Composer State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [aiStatusType, setAiStatusType] = useState<'Vang_KP' | 'Vang_P' | 'Di_Muon'>('Vang_KP');
  const [aiReason, setAiReason] = useState<string>('');
  const [aiTone, setAiTone] = useState<'lich_su' | 'an_can' | 'nghiem_tuc'>('lich_su');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Generator Call
  const handleGenerateAiMessage = async () => {
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.fullName,
          className: student.className,
          date: new Date().toLocaleDateString('vi-VN'),
          status: aiStatusType,
          reason: aiReason,
          tone: aiTone,
        }),
      });

      const data = await res.json();
      setGeneratedMessage(data.message || '');
    } catch (err) {
      console.error(err);
      setGeneratedMessage('Đã xảy ra lỗi kết nối AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchZalo = (phone: string, text: string) => {
    // Clean phone number
    const cleanedPhone = phone.replace(/\D/g, '');
    try {
      if (text) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.error(e);
    }
    const zaloUrl = `https://zalo.me/${cleanedPhone}`;
    window.open(zaloUrl, '_blank');
  };

  const handleLaunchSMS = (phone: string, text: string) => {
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.open(smsUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase">
              Hệ thống thông báo Zalo / SMS
            </span>
            <span className="text-xs text-slate-500 font-medium">Tự động báo ngay khi điểm danh học sinh vắng học</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Gửi Thông Báo Tự Động Cho Phụ Huynh
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            id="btn-notif-tab-logs"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký đã gửi ({logs.length})
          </button>
          <button
            id="btn-notif-tab-ai"
            onClick={() => setActiveTab('ai_composer')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center space-x-1 ${
              activeTab === 'ai_composer' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Soạn tin nhắn</span>
          </button>
          <button
            id="btn-notif-tab-templates"
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'templates' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mẫu tin nhắn
          </button>
          <button
            id="btn-notif-tab-channels"
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'channels' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cấu hình cổng Zalo/SMS
          </button>
        </div>
      </div>

      {/* TAB 1: AI COMPOSER */}
      {activeTab === 'ai_composer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-base border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3>AI Soạn Tin Nhắn Chuẩn Sư Phạm Việt Nam</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn Học Sinh:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.code} - Lớp {s.className})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Trạng thái:</label>
                <select
                  value={aiStatusType}
                  onChange={(e) => setAiStatusType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Vang_KP">Vắng không phép</option>
                  <option value="Vang_P">Vắng có phép</option>
                  <option value="Di_Muon">Đi học muộn</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phong cách văn phong:</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="lich_su">Lịch sự, tôn trọng</option>
                  <option value="an_can">Ân cần, quan tâm</option>
                  <option value="nghiem_tuc">Nghiêm túc, kỷ luật</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú / Lý do (nếu có):</label>
              <input
                type="text"
                placeholder="Ví dụ: Chưa thấy có mặt ở tiết 1..."
                value={aiReason}
                onChange={(e) => setAiReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              id="btn-generate-ai-msg"
              onClick={handleGenerateAiMessage}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'AI đang soạn thảo...' : 'Tạo tin nhắn bằng AI'}</span>
            </button>
          </div>

          {/* Result Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Nội dung tin nhắn xem trước
                </span>
                {generatedMessage && (
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>

              {generatedMessage ? (
                <div className="bg-slate-800/90 rounded-xl p-4 text-sm leading-relaxed text-slate-100 border border-slate-700">
                  {generatedMessage}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  Nhấn "Tạo tin nhắn bằng AI" để trợ lý Gemini tự động thiết lập nội dung gửi phụ huynh.
                </div>
              )}
            </div>

            {generatedMessage && (
              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  id="btn-launch-zalo-ai"
                  onClick={() => {
                    const student = students.find((s) => s.id === selectedStudentId);
                    if (student) handleLaunchZalo(student.parentPhone, generatedMessage);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Zalo nhắn ngay</span>
                </button>

                <button
                  id="btn-launch-sms-ai"
                  onClick={() => {
                    const student = students.find((s) => s.id === selectedStudentId);
                    if (student) handleLaunchSMS(student.parentPhone, generatedMessage);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Gửi SMS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Lịch Sử Nhật Ký Gửi Thông Báo Tự Động
            </h3>
            <span className="text-xs text-slate-500">Tất cả thông báo gần đây</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Học Sinh / Lớp</th>
                  <th className="py-3 px-4">Kênh & Loại</th>
                  <th className="py-3 px-4 min-w-[280px]">Nội Dung Tin Nhắn</th>
                  <th className="py-3 px-4">Thời Gian Gửi</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Nút gửi trực tiếp</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 text-sm">
                {logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-sm">{log.studentName}</p>
                      <p className="text-[11px] text-slate-500">Lớp {log.className} — PH: {log.parentPhone}</p>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded-md ${
                        log.channel === 'Zalo' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.channel}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{log.type}</p>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-700 max-w-xs">
                      <p className="line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        "{log.content}"
                      </p>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                      {log.sentAt}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        log.status === 'Đã xem' || log.status === 'Đã gửi'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        id={`btn-launch-zalo-log-${log.id}`}
                        onClick={() => handleLaunchZalo(log.parentPhone, log.content)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors"
                      >
                        Mở Zalo
                      </button>
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                      Chưa có nhật ký gửi thông báo nào trong hệ thống!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">{tpl.name}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-md">
                  {tpl.channel}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                "{tpl.content}"
              </div>

              <div className="text-[11px] text-slate-400">
                Biến khả dụng: <code className="text-blue-600 font-bold">{'{TenHocSinh}'}, {'{Lop}'}, {'{ThoiGian}'}, {'{LyDo}'}, {'{GiaoVien}'}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CHANNELS CONFIG */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {configs.map((cfg) => (
            <div key={cfg.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">{cfg.channel}</h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cfg.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cfg.enabled ? 'Đang hoạt động' : 'Tắt'}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Tự động gửi thông báo vắng mặt cho phụ huynh ngay khi lưu bảng điểm danh.
              </p>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Mã kết nối (OA/Sender):</label>
                  <input
                    type="text"
                    value={cfg.oaId || cfg.senderName || 'CHUA_CAU_HINH'}
                    readOnly
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
