import { GeneratorInput, ClassTimetable, StaffTimetable, TimeSlot, TimetableData } from '@/types/timetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TIME_SLOTS = [
  '08:00 AM-09:00 AM',
  '09:00 AM-09:50 AM',
  '10:10 AM-11:00 AM',
  '11:00 AM-11:50 AM',
  '11:50 AM-12:40 PM',
  '01:30 PM-02:20 PM',
  '02:20 PM-03:10 PM',
  '03:10 PM-04:00 PM'
];

function getTimeRange(period: number): string {
  return TIME_SLOTS[period - 1] || `Period ${period}`;
}

export function generateTimetable(input: GeneratorInput): TimetableData {
  const { departments, yearsPerDepartment, sectionsPerYear, subjects, daysPerWeek, periodsPerDay } = input;
  
  // Create a comprehensive schedule that fills all periods
  const classSchedules: ClassTimetable[] = [];
  const staffSchedules = new Map<string, TimeSlot[][]>();

  // Initialize class schedules for each department, year, and section
  departments.forEach(dept => {
    for (let year = 1; year <= yearsPerDepartment; year++) {
      for (let sectionIndex = 0; sectionIndex < sectionsPerYear; sectionIndex++) {
        const section = String.fromCharCode(65 + sectionIndex); // A, B, C, etc.
        const className = `${dept} - Year ${year} - Section ${section}`;
        const schedule: TimeSlot[][] = [];
        
        for (let day = 0; day < daysPerWeek; day++) {
          schedule.push([]);
        }
        
        classSchedules.push({ 
          className, 
          department: dept,
          year,
          section,
          schedule 
        });
      }
    }
  });

  // Initialize staff schedules
  const allStaff = new Set<string>();
  subjects.forEach(subject => {
    subject.staff.forEach(staffMember => {
      if (staffMember.trim()) {
        allStaff.add(staffMember);
      }
    });
  });

  allStaff.forEach(staffMember => {
    const schedule: TimeSlot[][] = [];
    for (let day = 0; day < daysPerWeek; day++) {
      schedule.push([]);
    }
    staffSchedules.set(staffMember, schedule);
  });

  // Create a pool of all available time slots for each class
  const totalPeriodsNeeded = daysPerWeek * periodsPerDay;
  const validSubjects = subjects.filter(s => s.name.trim() && s.staff.some(staff => staff.trim()));
  
  if (validSubjects.length === 0) {
    throw new Error('No valid subjects provided');
  }

  // For each class, generate a complete schedule
  for (let classIndex = 0; classIndex < classSchedules.length; classIndex++) {
    const classSchedule = classSchedules[classIndex];
    const periodsToFill: { day: number; period: number }[] = [];
    
    // Create all period slots
    for (let day = 0; day < daysPerWeek; day++) {
      for (let period = 1; period <= periodsPerDay; period++) {
        periodsToFill.push({ day, period });
      }
    }

    // First, place lab subjects (need consecutive periods)
    const labSubjects = validSubjects.filter(s => s.isLab);
    
    for (const subject of labSubjects) {
      let placed = false;
      
      for (let day = 0; day < daysPerWeek && !placed; day++) {
        // Try to find consecutive periods for labs
        for (let startPeriod = 1; startPeriod <= periodsPerDay - subject.duration + 1 && !placed; startPeriod++) {
          // Check if all required consecutive periods are available
          let canPlace = true;
          for (let dur = 0; dur < subject.duration; dur++) {
            const periodIndex = periodsToFill.findIndex(p => p.day === day && p.period === startPeriod + dur);
            if (periodIndex === -1) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            // Find available staff for this time slot
            const availableStaff = subject.staff.find(staffMember => {
              if (!staffMember.trim()) return false;
              const staffSchedule = staffSchedules.get(staffMember)!;
              
              // Check if staff is free for all required consecutive periods
              for (let dur = 0; dur < subject.duration; dur++) {
                const existingSlot = staffSchedule[day].find(slot => slot.period === startPeriod + dur);
                if (existingSlot) return false;
              }
              return true;
            });

            if (availableStaff) {
              // Place the lab subject
              for (let dur = 0; dur < subject.duration; dur++) {
                const currentPeriod = startPeriod + dur;
                const slot: TimeSlot = {
                  day: DAYS[day],
                  period: currentPeriod,
                  timeRange: getTimeRange(currentPeriod),
                  subject: subject.name,
                  subjectCode: subject.code,
                  staff: availableStaff,
                  className: classSchedule.className
                };

                classSchedule.schedule[day].push(slot);
                
                const staffSchedule = staffSchedules.get(availableStaff)!;
                staffSchedule[day].push({
                  day: DAYS[day],
                  period: currentPeriod,
                  timeRange: getTimeRange(currentPeriod),
                  subject: `${subject.name} (${classSchedule.className})`,
                  subjectCode: subject.code,
                  staff: availableStaff,
                  className: classSchedule.className
                });

                // Remove this period from available periods
                const periodIndex = periodsToFill.findIndex(p => p.day === day && p.period === currentPeriod);
                if (periodIndex !== -1) {
                  periodsToFill.splice(periodIndex, 1);
                }
              }
              placed = true;
            }
          }
        }
      }
    }

    // Fill remaining periods with regular subjects
    const regularSubjects = validSubjects.filter(s => !s.isLab);
    
    for (const { day, period } of periodsToFill) {
      // Distribute subjects evenly
      const subjectIndex = ((day * periodsPerDay + period - 1) % regularSubjects.length);
      const subject = regularSubjects[subjectIndex] || regularSubjects[0];
      
      // Find available staff
      const availableStaff = subject.staff.find(staffMember => {
        if (!staffMember.trim()) return false;
        const staffSchedule = staffSchedules.get(staffMember)!;
        return !staffSchedule[day].find(slot => slot.period === period);
      }) || subject.staff.find(staff => staff.trim()) || 'Unassigned';

      const slot: TimeSlot = {
        day: DAYS[day],
        period,
        timeRange: getTimeRange(period),
        subject: subject.name,
        subjectCode: subject.code,
        staff: availableStaff,
        className: classSchedule.className
      };

      classSchedule.schedule[day].push(slot);
      
      if (staffSchedules.has(availableStaff)) {
        const staffSchedule = staffSchedules.get(availableStaff)!;
        staffSchedule[day].push({
          day: DAYS[day],
          period,
          timeRange: getTimeRange(period),
          subject: `${subject.name} (${classSchedule.className})`,
          subjectCode: subject.code,
          staff: availableStaff,
          className: classSchedule.className
        });
      }
    }

    // Sort each day's schedule by period
    classSchedule.schedule.forEach(daySchedule => {
      daySchedule.sort((a, b) => a.period - b.period);
    });
  }

  // Sort staff schedules by period
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