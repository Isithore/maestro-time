import { GeneratorInput, ClassTimetable, StaffTimetable, TimeSlot, TimetableData } from '@/types/timetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Enhanced timetable generation with smart algorithms
export function generateTimetable(input: GeneratorInput): TimetableData {
  const { numClasses, subjects, daysPerWeek, periodsPerDay } = input;
  
  const validSubjects = subjects.filter(s => s.name.trim() && s.staff.some(staff => staff.trim()));
  if (validSubjects.length === 0) {
    throw new Error('No valid subjects provided');
  }

  // Initialize data structures
  const classSchedules: ClassTimetable[] = [];
  const staffSchedules = new Map<string, TimeSlot[][]>();
  const staffWorkload = new Map<string, { daily: number[], total: number }>();
  
  // Get all unique staff members
  const allStaff = new Set<string>();
  subjects.forEach(subject => {
    subject.staff.forEach(staffMember => {
      if (staffMember.trim()) {
        allStaff.add(staffMember);
        staffWorkload.set(staffMember, { 
          daily: new Array(daysPerWeek).fill(0), 
          total: 0 
        });
      }
    });
  });

  // Initialize schedules
  for (let i = 0; i < numClasses; i++) {
    const className = `Class ${String.fromCharCode(65 + i)}`;
    const schedule: TimeSlot[][] = Array.from({ length: daysPerWeek }, () => []);
    classSchedules.push({ className, schedule });
  }

  allStaff.forEach(staffMember => {
    const schedule: TimeSlot[][] = Array.from({ length: daysPerWeek }, () => []);
    staffSchedules.set(staffMember, schedule);
  });

  // Calculate subject frequencies based on importance
  const subjectPool = createSubjectPool(validSubjects, daysPerWeek * periodsPerDay);
  
  // Generate timetable for each class
  for (let classIndex = 0; classIndex < numClasses; classIndex++) {
    const classSchedule = classSchedules[classIndex];
    
    // Create available time slots
    const availableSlots: { day: number; period: number }[] = [];
    for (let day = 0; day < daysPerWeek; day++) {
      for (let period = 1; period <= periodsPerDay; period++) {
        availableSlots.push({ day, period });
      }
    }
    
    // Phase 1: Place lab subjects with consecutive periods
    placeLaboratorySubjects(
      validSubjects.filter(s => s.isLab),
      classSchedule,
      availableSlots,
      staffSchedules,
      staffWorkload,
      daysPerWeek,
      periodsPerDay
    );
    
    // Phase 2: Fill remaining slots with regular subjects
    const regularSubjects = validSubjects.filter(s => !s.isLab);
    fillRegularSubjects(
      regularSubjects,
      classSchedule,
      availableSlots,
      staffSchedules,
      staffWorkload,
      subjectPool,
      periodsPerDay
    );
    
    // Sort schedules by period
    classSchedule.schedule.forEach(daySchedule => {
      daySchedule.sort((a, b) => a.period - b.period);
    });
  }

  // Sort staff schedules
  staffSchedules.forEach(schedule => {
    schedule.forEach(daySchedule => {
      daySchedule.sort((a, b) => a.period - b.period);
    });
  });

  const staffTimetables: StaffTimetable[] = Array.from(staffSchedules.entries()).map(
    ([staffName, schedule]) => ({ staffName, schedule })
  );

  return {
    classes: classSchedules,
    staff: staffTimetables
  };
}

// Create weighted subject pool based on subject importance
function createSubjectPool(subjects: any[], totalSlots: number): string[] {
  const pool: string[] = [];
  const regularSubjects = subjects.filter(s => !s.isLab);
  
  if (regularSubjects.length === 0) return [];
  
  // Calculate base frequency per subject
  const baseFrequency = Math.floor(totalSlots / regularSubjects.length);
  const remainder = totalSlots % regularSubjects.length;
  
  // Add subjects to pool with calculated frequencies
  regularSubjects.forEach((subject, index) => {
    const frequency = baseFrequency + (index < remainder ? 1 : 0);
    for (let i = 0; i < frequency; i++) {
      pool.push(subject.name);
    }
  });
  
  // Shuffle for variety
  return shuffleArray([...pool]);
}

// Enhanced lab subject placement with better conflict resolution
function placeLaboratorySubjects(
  labSubjects: any[],
  classSchedule: ClassTimetable,
  availableSlots: { day: number; period: number }[],
  staffSchedules: Map<string, TimeSlot[][]>,
  staffWorkload: Map<string, { daily: number[], total: number }>,
  daysPerWeek: number,
  periodsPerDay: number
) {
  const labPlacements: { subject: any; day: number; startPeriod: number; staff: string }[] = [];
  
  // First, find all possible placements for each lab
  for (const subject of labSubjects) {
    const possiblePlacements: { day: number; startPeriod: number; staff: string; score: number }[] = [];
    
    for (let day = 0; day < daysPerWeek; day++) {
      for (let startPeriod = 1; startPeriod <= periodsPerDay - subject.duration + 1; startPeriod++) {
        // Check if consecutive slots are available
        const slotsNeeded = Array.from({ length: subject.duration }, (_, i) => ({
          day,
          period: startPeriod + i
        }));
        
        const allSlotsAvailable = slotsNeeded.every(slot =>
          availableSlots.some(available => 
            available.day === slot.day && available.period === slot.period
          )
        );
        
        if (allSlotsAvailable) {
          // Find best staff member for this slot
          const bestStaff = findOptimalStaff(
            subject.staff,
            day,
            slotsNeeded.map(s => s.period),
            staffSchedules,
            staffWorkload
          );
          
          if (bestStaff) {
            const score = calculatePlacementScore(day, startPeriod, staffWorkload.get(bestStaff)!);
            possiblePlacements.push({ day, startPeriod, staff: bestStaff, score });
          }
        }
      }
    }
    
    // Choose best placement
    if (possiblePlacements.length > 0) {
      possiblePlacements.sort((a, b) => b.score - a.score);
      const bestPlacement = possiblePlacements[0];
      labPlacements.push({ 
        subject, 
        day: bestPlacement.day, 
        startPeriod: bestPlacement.startPeriod, 
        staff: bestPlacement.staff 
      });
    }
  }
  
  // Place the labs
  for (const placement of labPlacements) {
    placeLabSubject(
      placement.subject,
      placement.day,
      placement.startPeriod,
      placement.staff,
      classSchedule,
      availableSlots,
      staffSchedules,
      staffWorkload
    );
  }
}

// Smart regular subject filling with variety and balance
function fillRegularSubjects(
  regularSubjects: any[],
  classSchedule: ClassTimetable,
  availableSlots: { day: number; period: number }[],
  staffSchedules: Map<string, TimeSlot[][]>,
  staffWorkload: Map<string, { daily: number[], total: number }>,
  subjectPool: string[],
  periodsPerDay: number
) {
  let poolIndex = 0;
  const dailySubjectCount = new Map<string, number[]>();
  
  // Initialize daily subject tracking
  regularSubjects.forEach(subject => {
    dailySubjectCount.set(subject.name, new Array(5).fill(0));
  });
  
  // Shuffle available slots for variety
  const shuffledSlots = shuffleArray([...availableSlots]);
  
  for (const { day, period } of shuffledSlots) {
    // Get next subject from pool
    const subjectName = subjectPool[poolIndex % subjectPool.length];
    const subject = regularSubjects.find(s => s.name === subjectName);
    
    if (!subject) continue;
    
    // Check if this subject already appears too much today
    const todayCount = dailySubjectCount.get(subjectName)![day];
    const maxPerDay = Math.ceil(periodsPerDay / 3); // Max 3 periods per day for variety
    
    if (todayCount >= maxPerDay) {
      // Find alternative subject
      const alternativeSubject = findAlternativeSubject(
        regularSubjects,
        day,
        dailySubjectCount,
        maxPerDay
      );
      if (alternativeSubject) {
        placeRegularSubject(
          alternativeSubject,
          day,
          period,
          classSchedule,
          staffSchedules,
          staffWorkload,
          dailySubjectCount
        );
      }
    } else {
      placeRegularSubject(
        subject,
        day,
        period,
        classSchedule,
        staffSchedules,
        staffWorkload,
        dailySubjectCount
      );
    }
    
    poolIndex++;
  }
}

// Helper functions
function findOptimalStaff(
  candidateStaff: string[],
  day: number,
  periods: number[],
  staffSchedules: Map<string, TimeSlot[][]>,
  staffWorkload: Map<string, { daily: number[], total: number }>
): string | null {
  const availableStaff = candidateStaff.filter(staffMember => {
    if (!staffMember.trim()) return false;
    const schedule = staffSchedules.get(staffMember)!;
    return periods.every(period => !schedule[day].find(slot => slot.period === period));
  });
  
  if (availableStaff.length === 0) return null;
  
  // Choose staff with least workload
  return availableStaff.reduce((best, current) => {
    const bestWorkload = staffWorkload.get(best)!;
    const currentWorkload = staffWorkload.get(current)!;
    
    if (currentWorkload.daily[day] < bestWorkload.daily[day]) return current;
    if (currentWorkload.daily[day] === bestWorkload.daily[day] && 
        currentWorkload.total < bestWorkload.total) return current;
    return best;
  });
}

function calculatePlacementScore(day: number, period: number, workload: { daily: number[], total: number }): number {
  // Prefer middle periods and balanced daily workload
  const periodScore = period >= 3 && period <= 6 ? 10 : 5;
  const workloadScore = Math.max(0, 10 - workload.daily[day]);
  return periodScore + workloadScore;
}

function placeLabSubject(
  subject: any,
  day: number,
  startPeriod: number,
  staff: string,
  classSchedule: ClassTimetable,
  availableSlots: { day: number; period: number }[],
  staffSchedules: Map<string, TimeSlot[][]>,
  staffWorkload: Map<string, { daily: number[], total: number }>
) {
  for (let dur = 0; dur < subject.duration; dur++) {
    const currentPeriod = startPeriod + dur;
    
    // Create time slot
    const slot: TimeSlot = {
      day: DAYS[day],
      period: currentPeriod,
      subject: subject.name,
      staff: staff,
      className: classSchedule.className
    };
    
    classSchedule.schedule[day].push(slot);
    
    const staffSchedule = staffSchedules.get(staff)!;
    staffSchedule[day].push({
      day: DAYS[day],
      period: currentPeriod,
      subject: `${subject.name} (${classSchedule.className})`,
      staff: staff,
      className: classSchedule.className
    });
    
    // Update workload
    const workload = staffWorkload.get(staff)!;
    workload.daily[day]++;
    workload.total++;
    
    // Remove from available slots
    const slotIndex = availableSlots.findIndex(s => s.day === day && s.period === currentPeriod);
    if (slotIndex !== -1) {
      availableSlots.splice(slotIndex, 1);
    }
  }
}

function placeRegularSubject(
  subject: any,
  day: number,
  period: number,
  classSchedule: ClassTimetable,
  staffSchedules: Map<string, TimeSlot[][]>,
  staffWorkload: Map<string, { daily: number[], total: number }>,
  dailySubjectCount: Map<string, number[]>
) {
  const staff = findOptimalStaff(
    subject.staff,
    day,
    [period],
    staffSchedules,
    staffWorkload
  ) || subject.staff.find(s => s.trim()) || 'Unassigned';
  
  const slot: TimeSlot = {
    day: DAYS[day],
    period,
    subject: subject.name,
    staff: staff,
    className: classSchedule.className
  };
  
  classSchedule.schedule[day].push(slot);
  
  if (staffSchedules.has(staff)) {
    const staffSchedule = staffSchedules.get(staff)!;
    staffSchedule[day].push({
      day: DAYS[day],
      period,
      subject: `${subject.name} (${classSchedule.className})`,
      staff: staff,
      className: classSchedule.className
    });
    
    const workload = staffWorkload.get(staff)!;
    workload.daily[day]++;
    workload.total++;
  }
  
  // Update subject count
  const subjectCount = dailySubjectCount.get(subject.name)!;
  subjectCount[day]++;
}

function findAlternativeSubject(
  subjects: any[],
  day: number,
  dailySubjectCount: Map<string, number[]>,
  maxPerDay: number
): any | null {
  return subjects.find(subject => 
    dailySubjectCount.get(subject.name)![day] < maxPerDay
  ) || subjects[0];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}