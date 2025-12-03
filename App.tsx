import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { EmployeeRecord, ShiftConfig } from './types';
import { parseExcelData } from './utils/excelProcessor';
import ConfigPanel from './components/ConfigPanel';
import ResultsTable from './components/ResultsTable';

const App: React.FC = () => {
  const [data, setData] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default Configuration
  const [config, setConfig] = useState<ShiftConfig>({
    defaultStart: '08:00',
    shifts: {
      'Ca1': '07:00', // Example default
    },
    employees: {}
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setData([]);

    try {
      const records = await parseExcelData(file, config);
      setData(records);
      if (records.length === 0) {
        setError("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra cấu trúc file (ID: -> Dữ liệu).");
      }
    } catch (err: any) {
      console.error(err);
      setError("Lỗi đọc file: " + (err.message || "Vui lòng đảm bảo file đúng định dạng Excel."));
    } finally {
      setLoading(false);
      // Reset input value to allow re-uploading same file if needed
      event.target.value = '';
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-900/50">
                <FileSpreadsheet size={32} />
            </div>
            AutoTimekeeper Pro
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Hệ thống tự động xử lý bảng chấm công Excel, tính giờ trễ và phát hiện lỗi logic.
          </p>
        </header>

        {/* Main Control Area */}
        <div className="bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-800">
            
          {/* Config Section */}
          <div className="mb-8 pb-8 border-b border-slate-800">
             <div className="flex items-start gap-4">
                 <div className="flex-1">
                     <h2 className="text-lg font-semibold mb-2 text-white">1. Cấu hình Giờ làm việc</h2>
                     <p className="text-slate-400 text-sm mb-4">
                         Thiết lập giờ bắt đầu ca làm việc mặc định hoặc theo tên nhân viên/tên ca trước khi tải file lên.
                     </p>
                     <ConfigPanel config={config} onConfigChange={setConfig} />
                 </div>
             </div>
          </div>

          {/* Upload Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">2. Tải lên bảng chấm công</h2>
            <div className="flex flex-col items-center justify-center w-full">
                <label className={`
                    flex flex-col items-center justify-center w-full h-48 
                    border-2 border-dashed rounded-lg cursor-pointer 
                    transition-colors duration-200
                    ${loading ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-600 hover:bg-slate-800 hover:border-blue-500'}
                `}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {loading ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-8 w-8 bg-blue-500 rounded-full mb-2"></div>
                                <p className="text-sm text-blue-400">Đang xử lý dữ liệu...</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 mb-3 text-blue-500" />
                                <p className="mb-2 text-sm text-slate-300"><span className="font-semibold text-blue-400">Bấm để chọn file</span> hoặc kéo thả</p>
                                <p className="text-xs text-slate-500">XLSX, XLS (Theo cấu trúc ID -> Data)</p>
                            </>
                        )}
                    </div>
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
                </label>
            </div>
            {error && (
                <div className="mt-4 p-4 bg-red-900/30 text-red-200 rounded-lg flex items-center gap-2 border border-red-900/50">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}
          </div>
        </div>

        {/* Results Area */}
        {data.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <ResultsTable data={data} />
            </div>
        )}

      </div>
    </div>
  );
};

export default App;