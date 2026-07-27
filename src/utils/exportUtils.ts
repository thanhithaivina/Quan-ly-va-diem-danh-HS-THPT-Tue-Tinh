import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, AbsenceLeave, TimeRangeOption } from '../types';
import { getStatusBadgeInfo } from './vietnameseSort';

/**
 * Filters attendance records based on class, student, and timeframe
 */
export function filterAttendanceRecords(
  records: AttendanceRecord[],
  students: Student[],
  className: string,
  studentId?: string,
  timeRange: TimeRangeOption = 'month',
  customStartDate?: string,
  customEndDate?: string
) {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (timeRange) {
    case 'today':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      break;
    case 'week':
      {
        const dayOfWeek = today.getDay() || 7; // 1 (Mon) to 7 (Sun)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (dayOfWeek - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'semester1':
      startDate = new Date(today.getFullYear(), 8, 1); // Sept 1
      endDate = new Date(today.getFullYear() + 1, 0, 15, 23, 59, 59); // Jan 15 next year
      break;
    case 'semester2':
      startDate = new Date(today.getFullYear(), 0, 16); // Jan 16
      endDate = new Date(today.getFullYear(), 4, 31, 23, 59, 59); // May 31
      break;
    case 'year':
      startDate = new Date(today.getFullYear() - 1, 8, 1);
      endDate = new Date(today.getFullYear(), 4, 31, 23, 59, 59);
      break;
    case 'custom':
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) endDate = new Date(customEndDate + 'T23:59:59');
      break;
  }

  const startIso = startDate.toISOString().split('T')[0];
  const endIso = endDate.toISOString().split('T')[0];

  return records.filter((rec) => {
    if (className !== 'ALL' && rec.className !== className) return false;
    if (studentId && rec.studentId !== studentId) return false;
    return rec.date >= startIso && rec.date <= endIso;
  }).map((rec) => {
    const student = studentMap.get(rec.studentId);
    return {
      ...rec,
      studentName: student?.fullName || 'Học sinh',
      studentCode: student?.code || '',
      parentPhone: student?.parentPhone || '',
      role: student?.role || 'Học sinh',
    };
  });
}

/**
 * Export attendance report to Excel file (.xlsx)
 */
export function exportAttendanceToExcel(
  records: any[],
  students: Student[],
  className: string,
  timeRangeLabel: string
) {
  // Sheet 1: Chi tiết điểm danh theo từng lượt
  const detailRows = records.map((r, index) => {
    const statusText = getStatusBadgeInfo(r.overallStatus).label;
    return {
      'STT': index + 1,
      'Mã Học Sinh': r.studentCode,
      'Họ và Tên': r.studentName,
      'Lớp': r.className,
      'Ngày': r.date,
      'Trạng Thái': statusText,
      'Số Phút Muộn': r.minutesLate || 0,
      'Ghi Chú / Lý Do': r.note || '',
      'SĐT Phụ Huynh': r.parentPhone,
      'Đã Thông Báo PH': r.notifiedParent ? 'Có' : 'Chưa',
    };
  });

  // Sheet 2: Tổng hợp theo từng học sinh
  const summaryMap: Record<string, {
    code: string;
    name: string;
    className: string;
    totalPresent: number;
    totalPermitted: number;
    totalUnexcused: number;
    totalLate: number;
    totalSick: number;
    parentPhone: string;
  }> = {};

  records.forEach((r) => {
    if (!summaryMap[r.studentId]) {
      summaryMap[r.studentId] = {
        code: r.studentCode,
        name: r.studentName,
        className: r.className,
        totalPresent: 0,
        totalPermitted: 0,
        totalUnexcused: 0,
        totalLate: 0,
        totalSick: 0,
        parentPhone: r.parentPhone,
      };
    }

    const item = summaryMap[r.studentId];
    if (r.overallStatus === 'Co_Mat') item.totalPresent++;
    else if (r.overallStatus === 'Vang_P') item.totalPermitted++;
    else if (r.overallStatus === 'Vang_KP') item.totalUnexcused++;
    else if (r.overallStatus === 'Di_Muon') item.totalLate++;
    else if (r.overallStatus === 'Nghi_Om') item.totalSick++;
  });

  const summaryRows = Object.values(summaryMap).map((item, idx) => {
    const totalDays = item.totalPresent + item.totalPermitted + item.totalUnexcused + item.totalLate + item.totalSick;
    const rate = totalDays > 0 ? (((item.totalPresent + item.totalLate) / totalDays) * 100).toFixed(1) + '%' : '100%';
    return {
      'STT': idx + 1,
      'Mã HS': item.code,
      'Họ và Tên': item.name,
      'Lớp': item.className,
      'Có Mặt': item.totalPresent,
      'Vắng Có Phép': item.totalPermitted,
      'Vắng Không Phép': item.totalUnexcused,
      'Đi Muộn': item.totalLate,
      'Nghỉ Ốm': item.totalSick,
      'Tỷ Lệ Chuyên Cần': rate,
      'SĐT Phụ Huynh': item.parentPhone,
    };
  });

  const wb = XLSX.utils.book_new();
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Hợp Học Sinh');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi Tiết Điểm Danh');

  const fileName = `Bao_Cao_Chuyen_Can_${className}_${timeRangeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Triggers browser window print preview for formatted report sheet
 */
export function printFormattedReport(
  records: any[],
  className: string,
  timeRangeLabel: string,
  teacherName: string = 'Cô Nguyễn Thị Hoa'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString('vi-VN');

  // Calculate summaries
  const studentMap: Record<string, any> = {};
  records.forEach((r) => {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = {
        code: r.studentCode,
        name: r.studentName,
        className: r.className,
        Co_Mat: 0,
        Vang_P: 0,
        Vang_KP: 0,
        Di_Muon: 0,
        Nghi_Om: 0,
      };
    }
    studentMap[r.studentId][r.overallStatus] = (studentMap[r.studentId][r.overallStatus] || 0) + 1;
  });

  const summaryList = Object.values(studentMap);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BÁO CÁO TỔNG HỢP CHUYÊN CẦN HỌC SINH</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 30px; font-size: 13pt; color: #000; }
        .header { text-align: center; margin-bottom: 25px; }
        .header h3 { margin: 0; text-transform: uppercase; font-size: 14pt; }
        .header h2 { margin: 10px 0; text-transform: uppercase; font-size: 18pt; color: #1e3a8a; }
        .info { margin-bottom: 15px; display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #000; padding: 6px 10px; text-align: center; }
        th { background-color: #f3f4f6; font-weight: bold; }
        td.text-left { text-align: left; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
        .footer div { width: 40%; }
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h3>TRƯỜNG THPT TUỆ TĨNH</h3>
        <h2>BÁO CÁO TỔNG HỢP THỜI GIAN VẮNG MẶT & CHUYÊN CẦN</h2>
        <p>Lớp: <strong>${className}</strong> | Thời gian báo cáo: <strong>${timeRangeLabel}</strong></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã HS</th>
            <th>Họ và Tên Học Sinh</th>
            <th>Có Mặt</th>
            <th>Vắng Có Phép</th>
            <th>Vắng KP</th>
            <th>Đi Muộn</th>
            <th>Nghỉ Ốm</th>
            <th>Tỷ Lệ (%)</th>
          </tr>
        </thead>
        <tbody>
          ${summaryList.map((item: any, idx: number) => {
            const total = item.Co_Mat + item.Vang_P + item.Vang_KP + item.Di_Muon + item.Nghi_Om;
            const rate = total > 0 ? (((item.Co_Mat + item.Di_Muon) / total) * 100).toFixed(1) + '%' : '100%';
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.code}</td>
                <td class="text-left">${item.name}</td>
                <td>${item.Co_Mat}</td>
                <td>${item.Vang_P}</td>
                <td>${item.Vang_KP}</td>
                <td>${item.Di_Muon}</td>
                <td>${item.Nghi_Om}</td>
                <td><strong>${rate}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <p><em>Ngày ..... tháng ..... năm 2026</em></p>
          <p><strong>NGƯỜI LẬP BÁO CÁO</strong></p>
          <br/><br/><br/>
          <p>___________________</p>
        </div>
        <div>
          <p><em>Ngày ${todayStr}</em></p>
          <p><strong>GIÁO VIÊN CHỦ NHIỆM</strong></p>
          <br/><br/><br/>
          <p><strong>${teacherName}</strong></p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
