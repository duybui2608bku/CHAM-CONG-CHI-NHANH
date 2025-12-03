import React, { useState } from 'react';
import { EmployeeRecord, ProcessedDay } from '../types';
import { AlertTriangle, CheckCircle, Clock, Download, ChevronDown, ChevronRight, XCircle, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  data: EmployeeRecord[];
}

const ResultsTable: React.FC<Props> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const filteredData = data.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (day: ProcessedDay) => {
    if (day.status === 'valid') return 'bg-green-900/30 text-green-400 border-green-900/50';
    if (day.status === 'absent') return 'bg-slate-800 text-slate-500 border-slate-700';
    if (day.status === 'missing_in' || day.status === 'missing_out') return 'bg-orange-900/30 text-orange-400 border-orange-900/50';
    if (day.status === 'invalid') return 'bg-red-900/30 text-red-400 border-red-900/50';
    return '';
  };

  const exportExcel = () => {
    // Flatten data for export (using filtered list or full list? Requirement usually implies full list export, but let's export filtered for wysiwyg)
    // Actually, normally export should be everything. Let's export currently visible for flexibility.
    const listToExport = filteredData;
    
    const flatData: any[] = [];
    listToExport.forEach(emp => {
      emp.attendance.forEach(day => {
        if (day.status !== 'absent' || day.rawInput) {
          flatData.push({
            'ID NV': emp.id,
            'Họ Tên': emp.name,
            'Phòng Ban': emp.department,
            'Ca': emp.shift,
            'Ngày': day.day,
            'Giờ Vào': day.checkIn || '',
            'Giờ Ra': day.checkOut || '',
            'Đi Trễ (phút)': day.lateMinutes,
            'Trạng thái': day.status,
            'Ghi chú': day.note.join(', '),
            'Dữ liệu gốc': day.rawInput.replace(/\n/g, ' ')
          });
        }
      });
    });

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ChamCong");
    XLSX.writeFile(wb, "KetQuaChamCong.xlsx");
  };

  if (data.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-4 rounded-lg shadow-lg border border-slate-800 gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-xl font-bold text-white">Kết quả xử lý</h2>
          <p className="text-sm text-slate-400">Đang hiển thị {filteredData.length} / {data.length} nhân viên</p>
        </div>
        
        <div className="flex flex-1 w-full md:w-auto items-center gap-4 justify-end">
          <div className="relative flex-1 md:flex-none md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input 
                type="text" 
                placeholder="Tìm kiếm nhân viên..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-500"
             />
          </div>

          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap"
          >
            <Download size={20} /> Xuất Excel
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-sm border-b border-slate-700">
              <th className="p-4 font-semibold w-10"></th>
              <th className="p-4 font-semibold">Nhân viên</th>
              <th className="p-4 font-semibold">Phòng ban</th>
              <th className="p-4 font-semibold text-center">Tổng đi trễ</th>
              <th className="p-4 font-semibold text-center">Lỗi log</th>
              <th className="p-4 font-semibold text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(emp => (
              <React.Fragment key={emp.id}>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => toggleRow(emp.id)}>
                  <td className="p-4 text-slate-600">
                    {expandedRow === emp.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-200">{emp.name}</div>
                    <div className="text-xs text-slate-500">ID: {emp.id} | Ca: {emp.shift}</div>
                  </td>
                  <td className="p-4 text-slate-400">{emp.department}</td>
                  <td className="p-4 text-center">
                    {emp.totalLateMinutes > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-900/50">
                        <Clock size={12} /> {emp.totalLateMinutes}p
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                     {emp.totalErrors > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/40 text-orange-300 border border-orange-900/50">
                        <AlertTriangle size={12} /> {emp.totalErrors}
                      </span>
                    ) : (
                      <span className="text-green-500"><CheckCircle size={16} /></span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 hover:underline text-sm font-medium">Xem chi tiết</button>
                  </td>
                </tr>
                
                {/* Expanded Details Row */}
                {expandedRow === emp.id && (
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <td colSpan={6} className="p-4">
                      <div className="bg-slate-900 rounded border border-slate-700 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-800 text-slate-400 border-b border-slate-700">
                              <th className="p-2 text-center w-12">Ngày</th>
                              <th className="p-2 text-center">Vào</th>
                              <th className="p-2 text-center">Ra</th>
                              <th className="p-2 text-center">Đi trễ</th>
                              <th className="p-2">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emp.attendance.map(day => {
                              if (day.status === 'absent') return null; 
                              return (
                                <tr key={day.day} className={`border-b border-slate-800/50 ${getStatusColor(day)}`}>
                                  <td className="p-2 text-center font-medium">{day.day}</td>
                                  <td className="p-2 text-center">{day.checkIn || '-'}</td>
                                  <td className="p-2 text-center">{day.checkOut || '-'}</td>
                                  <td className="p-2 text-center font-bold">
                                    {day.lateMinutes > 0 ? `${day.lateMinutes}p` : ''}
                                  </td>
                                  <td className="p-2">
                                    {day.note.map((n, i) => (
                                      <span key={i} className="inline-block bg-black/20 px-1 rounded text-xs mr-1 border border-black/10">
                                        {n}
                                      </span>
                                    ))}
                                    {day.status === 'invalid' && <span className="flex items-center gap-1 mt-1 text-xs italic opacity-80"><XCircle size={10}/> Dữ liệu gốc: {day.rawInput.replace(/\n/g, ' ')}</span>}
                                  </td>
                                </tr>
                              );
                            })}
                            {emp.attendance.every(d => d.status === 'absent') && (
                              <tr><td colSpan={5} className="p-4 text-center text-slate-600 italic">Không có dữ liệu chấm công tháng này</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredData.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                        Không tìm thấy nhân viên nào phù hợp với "{searchTerm}"
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;