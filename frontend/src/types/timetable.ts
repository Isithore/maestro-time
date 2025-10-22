export interface Subject {
  id: string;
  name: string;
  code: string; // Course code like CS3591
  staff: string[];
  isLab: boolean;
  duration: number; // in periods
}

export interface TimeSlot {
  day: string;
  period: number;
  timeRange: string; // e.g., "08:00 AM-09:00 AM"
  subject: string;
  subjectCode: string;
  staff: string;
  className?: string;
  isBreak?: boolean;
  isLunch?: boolean;
}

export interface ClassTimetable {
  className: string;
  department: string;
  year: number;
  section: string;
  schedule: TimeSlot[][];
}

export interface StaffTimetable {
  staffName: string;
  schedule: TimeSlot[][];
}

export interface TimetableData {
  classes: ClassTimetable[];
  staff: StaffTimetable[];
}

export interface GeneratorInput {
  departments: string[];
  yearsPerDepartment: number;
  sectionsPerYear: number;
  subjects: Subject[];
  daysPerWeek: number;
  periodsPerDay: number;
  institutionName?: string;
  academicYear?: string;
}