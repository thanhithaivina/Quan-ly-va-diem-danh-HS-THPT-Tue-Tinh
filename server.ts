import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API if available
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Endpoint: Generate parent notification message
app.post("/api/ai/generate-notification", async (req, res) => {
  try {
    const { studentName, className, date, status, reason, tone = "lich_su" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback template if GEMINI_API_KEY is not configured
      const fallbackMsg = `Kính gửi Phụ huynh em ${studentName} (Lớp ${className}). Trường xin thông báo em ${studentName} ${status === 'Vang_KP' ? 'vắng mặt không phép' : status === 'Vang_P' ? 'vắng mặt có phép' : 'đi học muộn'} vào ngày ${date}${reason ? ` (Lý do: ${reason})` : ''}. Rất mong Phụ huynh phối hợp với Giáo viên chủ nhiệm để nắm rõ tình hình học tập của em. Xin cảm ơn!`;
      return res.json({ message: fallbackMsg });
    }

    const prompt = `Bạn là một Giáo viên Chủ nhiệm chuyên nghiệp, tận tâm tại Việt Nam. Hãy soạn một tin nhắn thông báo gửi qua Zalo/SMS cho Phụ huynh học sinh với thông tin sau:
- Tên học sinh: ${studentName}
- Lớp: ${className}
- Ngày: ${date}
- Trạng thái: ${status === 'Vang_KP' ? 'Vắng không phép' : status === 'Vang_P' ? 'Vắng có phép' : status === 'Di_Muon' ? 'Đi học muộn' : 'Vắng mặt'}
- Lý do (nếu có): ${reason || 'Chưa ghi nhận lý do'}
- Phong cách: ${tone === 'lich_su' ? 'Lịch sự, tôn trọng, ngắn gọn' : tone === 'an_can' ? 'Ấm áp, ân cần, thể hiện sự quan tâm sâu sắc' : 'Nghiêm túc, nhấn mạnh tính kỷ luật'}

Yêu cầu: Tin nhắn ngắn gọn (dưới 150 từ), đầy đủ thông tin, phù hợp gửi qua Zalo/SMS, ngôn ngữ chuẩn mực sư phạm Việt Nam. Không để dư thừa dấu ngoặc kép.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ message: response.text?.trim() || "Không thể tạo tin nhắn." });
  } catch (error: any) {
    console.error("Error generating AI notification:", error);
    res.status(500).json({ error: "Lỗi tạo tin nhắn bằng AI", details: error.message });
  }
});

// AI Endpoint: Attendance Insights & Analysis Report
app.post("/api/ai/attendance-insights", async (req, res) => {
  try {
    const { className, totalStudents, stats, frequentAbsentStudents } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        analysis: `Lớp ${className} có sĩ số ${totalStudents} học sinh. Tỷ lệ chuyên cần bình thường đạt ${(stats?.attendanceRate || 95).toFixed(1)}%. Khuyến nghị Giáo viên chủ nhiệm duy trì theo dõi các học sinh có biểu hiện vắng học thường xuyên và liên hệ phụ huynh kịp thời.`
      });
    }

    const prompt = `Bạn là Chuyên gia tư vấn giáo dục & Quản lý trường học. Dựa trên số liệu chuyên cần của lớp ${className}:
- Sĩ số: ${totalStudents} học sinh
- Tỷ lệ chuyên cần chung: ${stats?.attendanceRate?.toFixed(1)}%
- Tổng số lượt vắng có phép: ${stats?.totalPermitted || 0}
- Tổng số lượt vắng không phép: ${stats?.totalUnexcused || 0}
- Tổng số lượt đi muộn: ${stats?.totalLate || 0}
- Danh sách học sinh nghỉ/muộn nhiều: ${JSON.stringify(frequentAbsentStudents || [])}

Hãy đưa ra một nhận xét ngắn gọn (3-4 đầu dòng) gồm:
1. Đánh giá tổng quan tình hình chuyên cần của lớp.
2. Phân tích nguyên nhân tiềm ẩn hoặc điểm cần lưu ý.
3. Lời khuyên/hành động cụ thể cho Giáo viên chủ nhiệm (cách làm việc với phụ huynh, học sinh).
Trình bày bằng Tiếng Việt, văn phong sư phạm, chuyên nghiệp, khích lệ.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text?.trim() });
  } catch (error: any) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ error: "Lỗi tạo phân tích AI", details: error.message });
  }
});

// Serve frontend in dev / production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
