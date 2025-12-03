export interface ProcessedDay {
  day: number;
  rawInput: string;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number;
  note: string[];
  status: 'valid' | 'missing_in' | 'missing_out' | 'invalid' | 'absent' | 'weekend';
}

export interface EmployeeRecord {
  id: string;
  name: string;
  department: string;
  shift: string;
  attendance: ProcessedDay[];
  totalLateMinutes: number;
  totalErrors: number;
}

export interface ShiftConfig {
  defaultStart: string;
  shifts: Record<string, string>; // e.g., "Ca1": "07:00"
  employees: Record<string, string>; // e.g., "Xuanpx": "07:30"
}

export interface ExcelRow extends Array<any> {}
