import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { EmployeeRecord } from '../types';
import { Sparkles, Loader2, FileText } from 'lucide-react';

interface Props {
  data: EmployeeRecord[];
}

const GeminiReport: React.FC<Props> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!process.env.API_KEY) {
      setError("Thiếu API Key. Ứng dụng này cần biến môi trường API_KEY.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Summarize data to save tokens and avoid huge payloads
      const summary = data.map(e => ({
        name: e.name,
        dept: e.department,
        totalLate: e.totalLateMinutes,
        errors: e.totalErrors,
        details: e.attendance
          .filter(d => d.status !== 'absent' && d.status !== 'valid')
          .map(d => `Ngày ${d.day}: ${d.status} (${d.note.join(', ')})`)
      })).filter(e => e.totalLate > 0 || e.errors > 0 || e.details.length > 0);

      const prompt = `
        Bạn là trợ lý ảo HR. Dưới đây là dữ liệu tóm tắt các bất thường trong chấm công.
        Hãy viết một báo cáo ngắn gọn, chuyên nghiệp (bằng tiếng Việt) gửi cho HR Manager.
        
        Nội dung cần có:
        1. Tổng quan số người vi phạm.
        2. Top 3 nhân viên đi trễ nhiều nhất (tính theo phút).
        3. Các lỗi phổ biến (quên check-in/out).
        4. Danh sách chi tiết các trường hợp cần lưu ý đặc biệt (ví dụ log sai giờ).
        
        Dữ liệu JSON:
        ${JSON.stringify(summary.slice(0, 20))} 
        (Dữ liệu có thể đã bị cắt bớt nếu quá dài, hãy phân tích dựa trên những gì nhận được).
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setReport(response.text || "Không có phản hồi từ AI.");

    } catch (err: any) {
      setError("Lỗi khi gọi Gemini API: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-100 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          AI Phân Tích Báo Cáo
        </h3>
        {!report && !loading && (
          <button 
            onClick={generateReport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Sparkles size={16} /> Tạo báo cáo ngay
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p>Đang phân tích dữ liệu chấm công...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="bg-white p-6 rounded border border-indigo-100 shadow-inner prose prose-sm max-w-none text-slate-700">
            <div className="whitespace-pre-wrap">{report}</div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setReport(null)} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                    Tạo lại báo cáo
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default GeminiReport;
