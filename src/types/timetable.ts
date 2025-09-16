export interface Subject {
  id: string;
  name: string;
  staff: string[];
  isLab: boolean;
  duration: number; // in periods
}

export interface TimeSlot {
  day: string;
  period: number;
  subject: string;
  staff: string;
  className?: string;
}

export interface ClassTimetable {
  className: string;
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
  numClasses: number;
  subjects: Subject[];
  daysPerWeek: number;
  periodsPerDay: number;
}