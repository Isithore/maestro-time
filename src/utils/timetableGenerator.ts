import { GeneratorInput, ClassTimetable, StaffTimetable, TimeSlot, TimetableData } from '@/types/timetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function generateTimetable(input: GeneratorInput): TimetableData {
  const { numClasses, subjects, daysPerWeek, periodsPerDay, breakPeriods } = input;
  
  // Initialize empty schedules for all classes
  const classSchedules: ClassTimetable[] = [];
  for (let i = 0; i < numClasses; i++) {
    const className = `Class ${String.fromCharCode(65 + i)}`; // A, B, C, etc.
    const schedule: TimeSlot[][] = [];
    
    for (let day = 0; day < daysPerWeek; day++) {
      const daySchedule: TimeSlot[] = [];
      for (let period = 1; period <= periodsPerDay; period++) {
        if (breakPeriods.includes(period)) {
          daySchedule.push({
            day: DAYS[day],
            period,
            isBreak: true,
            className
          });
        } else {
          daySchedule.push({
            day: DAYS[day],
            period,
            className
          });
        }
      }
      schedule.push(daySchedule);
    }
    
    classSchedules.push({ className, schedule });
  }

  // Track staff availability
  const staffSchedules = new Map<string, TimeSlot[][]>();
  
  // Initialize staff schedules
  subjects.forEach(subject => {
    subject.staff.forEach(staffMember => {
      if (!staffSchedules.has(staffMember)) {
        const schedule: TimeSlot[][] = [];
        for (let day = 0; day < daysPerWeek; day++) {
          const daySchedule: TimeSlot[] = [];
          for (let period = 1; period <= periodsPerDay; period++) {
            if (breakPeriods.includes(period)) {
              daySchedule.push({
                day: DAYS[day],
                period,
                isBreak: true
              });
            } else {
              daySchedule.push({
                day: DAYS[day],
                period
              });
            }
          }
          schedule.push(daySchedule);
        }
        staffSchedules.set(staffMember, schedule);
      }
    });
  });

  // Simple allocation algorithm
  // First, place lab subjects (they need consecutive periods)
  const labSubjects = subjects.filter(s => s.isLab);
  const regularSubjects = subjects.filter(s => !s.isLab);

  // Allocate lab subjects first
  labSubjects.forEach(subject => {
    for (let classIndex = 0; classIndex < numClasses; classIndex++) {
      const classSchedule = classSchedules[classIndex];
      let placed = false;

      for (let day = 0; day < daysPerWeek && !placed; day++) {
        for (let period = 0; period < periodsPerDay - subject.duration + 1 && !placed; period++) {
          // Check if consecutive periods are available
          let canPlace = true;
          for (let dur = 0; dur < subject.duration; dur++) {
            const slot = classSchedule.schedule[day][period + dur];
            if (slot.isBreak || slot.subject) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Check staff availability
            const availableStaff = subject.staff.find(staffMember => {
              const staffSchedule = staffSchedules.get(staffMember)!;
              for (let dur = 0; dur < subject.duration; dur++) {
                const staffSlot = staffSchedule[day][period + dur];
                if (staffSlot.isBreak || staffSlot.subject) {
                  return false;
                }
              }
              return true;
            });

            if (availableStaff) {
              // Place the lab subject
              for (let dur = 0; dur < subject.duration; dur++) {
                classSchedule.schedule[day][period + dur].subject = subject.name;
                classSchedule.schedule[day][period + dur].staff = availableStaff;
                
                const staffSchedule = staffSchedules.get(availableStaff)!;
                staffSchedule[day][period + dur].subject = `${subject.name} (${classSchedule.className})`;
                staffSchedule[day][period + dur].className = classSchedule.className;
              }
              placed = true;
            }
          }
        }
      }
    }
  });

  // Allocate regular subjects
  regularSubjects.forEach(subject => {
    for (let classIndex = 0; classIndex < numClasses; classIndex++) {
      const classSchedule = classSchedules[classIndex];
      const periodsNeeded = Math.ceil(30 / daysPerWeek); // Rough distribution

      let periodsAllocated = 0;
      for (let day = 0; day < daysPerWeek && periodsAllocated < periodsNeeded; day++) {
        for (let period = 0; period < periodsPerDay && periodsAllocated < periodsNeeded; period++) {
          const slot = classSchedule.schedule[day][period];
          
          if (!slot.isBreak && !slot.subject) {
            // Check staff availability
            const availableStaff = subject.staff.find(staffMember => {
              const staffSchedule = staffSchedules.get(staffMember)!;
              const staffSlot = staffSchedule[day][period];
              return !staffSlot.isBreak && !staffSlot.subject;
            });

            if (availableStaff) {
              slot.subject = subject.name;
              slot.staff = availableStaff;
              
              const staffSchedule = staffSchedules.get(availableStaff)!;
              staffSchedule[day][period].subject = `${subject.name} (${classSchedule.className})`;
              staffSchedule[day][period].className = classSchedule.className;
              
              periodsAllocated++;
            }
          }
        }
      }
    }
  });

  // Convert staff schedules to the required format
  const staffTimetables: StaffTimetable[] = Array.from(staffSchedules.entries()).map(
    ([staffName, schedule]) => ({ staffName, schedule })
  );

  return {
    classes: classSchedules,
    staff: staffTimetables
  };
}