import React, { useState } from 'react';
import { ShiftConfig } from '../types';
import { Settings, Plus, Trash2 } from 'lucide-react';

interface Props {
  config: ShiftConfig;
  onConfigChange: (newConfig: ShiftConfig) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for inputs
  const [newShiftKey, setNewShiftKey] = useState('');
  const [newShiftVal, setNewShiftVal] = useState('08:00');
  const [newEmpKey, setNewEmpKey] = useState('');
  const [newEmpVal, setNewEmpVal] = useState('07:00');

  const addShift = () => {
    if (newShiftKey) {
      onConfigChange({
        ...config,
        shifts: { ...config.shifts, [newShiftKey]: newShiftVal }
      });
      setNewShiftKey('');
    }
  };

  const removeShift = (key: string) => {
    const next = { ...config.shifts };
    delete next[key];
    onConfigChange({ ...config, shifts: next });
  };

  const addEmp = () => {
    if (newEmpKey) {
      onConfigChange({
        ...config,
        employees: { ...config.employees, [newEmpKey]: newEmpVal }
      });
      setNewEmpKey('');
    }
  };

  const removeEmp = (key: string) => {
    const next = { ...config.employees };
    delete next[key];
    onConfigChange({ ...config, employees: next });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 transition-colors border border-slate-700"
      >
        <Settings size={18} />
        Cấu hình Giờ làm
      </button>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 mb-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings size={20} /> Cấu hình quy tắc giờ làm
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-sm text-slate-400 hover:text-white">Đóng</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Default */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Giờ làm mặc định</label>
          <input 
            type="time" 
            value={config.defaultStart} 
            onChange={(e) => onConfigChange({...config, defaultStart: e.target.value})}
            className="w-full border border-slate-600 rounded px-3 py-2 bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-slate-500">Áp dụng cho tất cả nhân viên nếu không có cấu hình riêng.</p>
        </div>

        {/* Shift Overrides */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Theo Ca (VD: Ca1, Ca2)</label>
          <div className="flex gap-2 mb-2">
            <input 
              placeholder="Tên ca (VD: Ca1)" 
              value={newShiftKey}
              onChange={e => setNewShiftKey(e.target.value)}
              className="flex-1 border border-slate-600 bg-slate-700 text-white rounded px-2 py-1 text-sm placeholder-slate-500"
            />
            <input 
              type="time"
              value={newShiftVal}
              onChange={e => setNewShiftVal(e.target.value)}
              className="w-24 border border-slate-600 bg-slate-700 text-white rounded px-2 py-1 text-sm"
            />
            <button onClick={addShift} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"><Plus size={16}/></button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {Object.entries(config.shifts).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-sm bg-slate-700/50 p-2 rounded border border-slate-700">
                <span className="text-slate-300"><span className="font-semibold text-white">{key}</span>: {val}</span>
                <button onClick={() => removeShift(key)} className="text-red-400 hover:bg-red-900/30 p-1 rounded"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Overrides */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Theo Tên Nhân Viên</label>
          <div className="flex gap-2 mb-2">
            <input 
              placeholder="Tên NV" 
              value={newEmpKey}
              onChange={e => setNewEmpKey(e.target.value)}
              className="flex-1 border border-slate-600 bg-slate-700 text-white rounded px-2 py-1 text-sm placeholder-slate-500"
            />
            <input 
              type="time"
              value={newEmpVal}
              onChange={e => setNewEmpVal(e.target.value)}
              className="w-24 border border-slate-600 bg-slate-700 text-white rounded px-2 py-1 text-sm"
            />
            <button onClick={addEmp} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"><Plus size={16}/></button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {Object.entries(config.employees).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-sm bg-slate-700/50 p-2 rounded border border-slate-700">
                <span className="text-slate-300"><span className="font-semibold text-white">{key}</span>: {val}</span>
                <button onClick={() => removeEmp(key)} className="text-red-400 hover:bg-red-900/30 p-1 rounded"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;