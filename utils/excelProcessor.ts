import * as XLSX from 'xlsx';
import { EmployeeRecord, ProcessedDay, ShiftConfig } from '../types';

// Helper: Parse HH:mm to minutes from midnight
const timeToMinutes = (time: string): number => {
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return h * 60 + m;
};

// Helper: Convert minutes back to HH:mm for display
const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Helper: Get start time for an employee based on config
const getStartTime = (config: ShiftConfig, empName: string, shiftName: string): string => {
  // 1. Check specific employee override
  if (config.employees[empName]) return config.employees[empName];
  // 2. Check shift name override
  if (config.shifts[shiftName]) return config.shifts[shiftName];
  // 3. Default
  return config.defaultStart;
};

export const parseExcelData = async (
  file: File, 
  config: ShiftConfig
): Promise<EmployeeRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // IMPORTANT: raw: false ensures we get "07:49" strings instead of 0.3256 numbers
        // header: 1 returns array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          raw: false,
          defval: '' 
        }) as string[][];
        
        const records: EmployeeRecord[] = [];
        
        let currentEmp: Partial<EmployeeRecord> | null = null;
        let dayStartColIndex = -1; // Will be detected from the header row (1, 2, 3...)

        // Regex to extract ID, Name, Dept, Shift from strings like: "ID:37 Tên:Xuanpx Phòng ban:Hành chính Ca:Ca1"
        // Note: The spaces might vary, so we use \s+
        const empRegex = /ID:(.*?)\s+Tên:(.*?)\s+Phòng ban:(.*?)\s+Ca:(.*)/i;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          // Safe string conversion for the first few cells to detect patterns
          const firstCell = row[0] ? String(row[0]).trim() : '';
          
          // 1. Detect Employee Info Row
          if (firstCell.toUpperCase().startsWith('ID:')) {
            const match = firstCell.match(empRegex);
            if (match) {
              currentEmp = {
                id: match[1].trim(),
                name: match[2].trim(),
                department: match[3].trim(),
                shift: match[4].trim(),
                attendance: [],
                totalLateMinutes: 0,
                totalErrors: 0,
              };
              dayStartColIndex = -1; // Reset column detection
            }
            continue; 
          }

          // 2. Process rows if we have an active Employee
          if (currentEmp) {
            // Check if this is a "Day Header" row (containing "1", "2", "3"...)
            // We search for "1" in the row to determine the start column index
            const indexOfDay1 = row.findIndex(cell => String(cell).trim() === '1');
            
            if (indexOfDay1 !== -1) {
              // Check if next cell is "2" to be sure
              const cell2 = row[indexOfDay1 + 1] ? String(row[indexOfDay1 + 1]).trim() : '';
              if (cell2 === '2') {
                dayStartColIndex = indexOfDay1;
                continue; // Skip this header row
              }
            }

            // If we are here, it's the Data Row
            const empRecord = currentEmp as EmployeeRecord;
            const shiftStart = getStartTime(config, empRecord.name, empRecord.shift);
            const shiftStartMins = timeToMinutes(shiftStart);
            
            // If we didn't find a header row with "1", we assume column 0 is Day 1 
            // (based on common formats where ID row spans and data starts at col 0)
            const startCol = dayStartColIndex !== -1 ? dayStartColIndex : 0;

            // Iterate 31 days
            for (let d = 0; d < 31; d++) {
              const colIdx = startCol + d;
              const cellContent = row[colIdx] ? String(row[colIdx]).trim() : '';
              
              const processedDay: ProcessedDay = {
                day: d + 1,
                rawInput: cellContent,
                checkIn: null,
                checkOut: null,
                lateMinutes: 0,
                note: [],
                status: 'absent'
              };

              if (!cellContent) {
                empRecord.attendance.push(processedDay);
                continue;
              }

              // Extract timestamps (handles newlines, spaces)
              // Matches 07:49, 7:49, 21:00, etc.
              const timestamps = cellContent.match(/\d{1,2}:\d{2}/g);

              if (!timestamps || timestamps.length === 0) {
                 // It has content but no time? Mark invalid
                 processedDay.note.push('Lỗi định dạng');
                 processedDay.status = 'invalid';
                 empRecord.totalErrors++;
                 empRecord.attendance.push(processedDay);
                 continue;
              }

              // CRITICAL: Sort by minutes value
              const timesInMinutes = timestamps.map(timeToMinutes).sort((a, b) => a - b);
              
              // LOGIC RULES
              if (timesInMinutes.length >= 2) {
                // Case: >= 2 timestamps
                const minTime = timesInMinutes[0];
                const maxTime = timesInMinutes[timesInMinutes.length - 1];

                processedDay.checkIn = minutesToTime(minTime);
                processedDay.checkOut = minutesToTime(maxTime);
                
                // Check validity (All AM or All PM)
                const allAM = timesInMinutes.every(t => t < 720); // 12:00 = 720
                const allPM = timesInMinutes.every(t => t >= 720);

                if (allAM) {
                  processedDay.status = 'invalid';
                  processedDay.note.push('Lỗi: Toàn log sáng');
                  empRecord.totalErrors++;
                } else if (allPM) {
                  processedDay.status = 'invalid';
                  processedDay.note.push('Lỗi: Toàn log chiều');
                  empRecord.totalErrors++;
                } else {
                  processedDay.status = 'valid';
                }

              } else {
                // Case: 1 timestamp
                const t = timesInMinutes[0];
                if (t < 720) {
                  // Morning -> Check In, Missing Out
                  processedDay.checkIn = minutesToTime(t);
                  processedDay.status = 'missing_out';
                  processedDay.note.push('Quên Ra');
                  empRecord.totalErrors++;
                } else {
                  // Afternoon -> Check Out, Missing In
                  processedDay.checkOut = minutesToTime(t);
                  processedDay.status = 'missing_in';
                  processedDay.note.push('Quên Vào');
                  empRecord.totalErrors++;
                }
              }

              // CALCULATE LATENESS
              // Only if we have a valid Check In
              if (processedDay.checkIn) {
                 const checkInMins = timeToMinutes(processedDay.checkIn);
                 
                 // If check-in is unreasonably early (e.g. before 5am), maybe ignore? 
                 // But requirement says check-in < shift -> no late.
                 
                 if (checkInMins > shiftStartMins) {
                   processedDay.lateMinutes = checkInMins - shiftStartMins;
                   empRecord.totalLateMinutes += processedDay.lateMinutes;
                   processedDay.note.push(`Trễ ${processedDay.lateMinutes}p`);
                 }
              }

              empRecord.attendance.push(processedDay);
            }

            records.push(empRecord);
            currentEmp = null; // Reset for next employee search
          }
        }

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
};