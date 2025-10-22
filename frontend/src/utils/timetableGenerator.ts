const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// -------------------- Helper Functions --------------------

// Fisher–Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Example time range function (you probably have your own)
function getTimeRange(period: number): string {
  const startHour = 9 + Math.floor((period - 1) / 2);
  const startMinute = (period % 2 === 1) ? 0 : 30;
  const endHour = 9 + Math.floor(period / 2);
  const endMinute = (period % 2 === 1) ? 30 : 0;
  return `${String(startHour).padStart(2,'0')}:${String(startMinute).padStart(2,'0')} - ${String(endHour).padStart(2,'0')}:${String(endMinute).padStart(2,'0')}`;
}

// -------------------- Main Timetable Generator --------------------

export function generateTimetable(input: GeneratorInput): TimetableData {
  const {
    departments,
    yearsPerDepartment,
    sectionsPerYear,
    subjects,
    daysPerWeek,
    periodsPerDay,
    breakPeriods = {},
  } = input;

  const classSchedules: ClassTimetable[] = [];
  const staffSchedules = new Map<string, TimeSlot[]>();
  const unassignedSlots: { className: string; day: string; period: number }[] = [];

  // Init class schedules
  for (const dept of departments) {
    for (let year = 1; year <= yearsPerDepartment; year++) {
      for (let sectionIndex = 0; sectionIndex < sectionsPerYear; sectionIndex++) {
        const section = String.fromCharCode(65 + sectionIndex);
        const className = `${dept} - Year ${year} - Section ${section}`;
        classSchedules.push({ className, department: dept, year, section, schedule: [] });
      }
    }
  }

  // Init staff schedules
  const allStaff = new Set(subjects.flatMap(s => s.staff.filter(Boolean)));
  for (const staff of allStaff) {
    staffSchedules.set(staff, []);
  }

  const getLeastLoadedStaff = (subject: string[], day: number, period: number) => {
    let best: string | null = null;
    let minLoad = Infinity;

    for (const staff of subject) {
      const schedule = staffSchedules.get(staff);
      if (!schedule) continue;

      const isFree = !schedule.some(slot => slot.day === DAYS[day] && slot.period === period);
      const load = schedule.length;

      if (isFree && load < minLoad) {
        minLoad = load;
        best = staff;
      }
    }

    return best;
  };

  // Fill timetable
  for (const classSchedule of classSchedules) {
    const availablePeriods: { day: number; period: number }[] = [];

    for (let day = 0; day < daysPerWeek; day++) {
      for (let period = 1; period <= periodsPerDay; period++) {
        const dayName = DAYS[day];
        if (!breakPeriods[dayName]?.includes(period)) availablePeriods.push({ day, period });
      }
    }

    const shuffledSubjects = shuffleArray(subjects.filter(s => s.name.trim()));
    const labSubjects = shuffledSubjects.filter(s => s.isLab);
    const regularSubjects = shuffledSubjects.filter(s => !s.isLab);

    // Place labs first
    for (const lab of labSubjects) {
      let placed = false;

      for (let day = 0; day < daysPerWeek && !placed; day++) {
        for (let p = 1; p <= periodsPerDay - lab.duration + 1 && !placed; p++) {
          const isBreak = Array.from({ length: lab.duration }, (_, i) =>
            breakPeriods[DAYS[day]]?.includes(p + i)
          ).some(Boolean);
          if (isBreak) continue;

          const allFree = Array.from({ length: lab.duration }, (_, i) =>
            availablePeriods.some(ap => ap.day === day && ap.period === p + i)
          ).every(Boolean);

          const staff = getLeastLoadedStaff(lab.staff, day, p);
          if (allFree && staff) {
            for (let i = 0; i < lab.duration; i++) {
              const period = p + i;
              const slot: TimeSlot = {
                day: DAYS[day],
                period,
                timeRange: getTimeRange(period),
                subject: lab.name,
                subjectCode: lab.code,
                staff,
                className: classSchedule.className,
              };

              classSchedule.schedule.push(slot);
              staffSchedules.get(staff)!.push({ ...slot, subject: `${lab.name} (${classSchedule.className})` });

              const idx = availablePeriods.findIndex(ap => ap.day === day && ap.period === period);
              if (idx !== -1) availablePeriods.splice(idx, 1);
            }
            placed = true;
          }
        }
      }
      if (!placed) console.warn(`Could not place lab subject "${lab.name}" for ${classSchedule.className}`);
    }

    // Place regular subjects
    for (const { day, period } of availablePeriods) {
      const subject = regularSubjects[Math.floor(Math.random() * regularSubjects.length)];
      const staff = getLeastLoadedStaff(subject.staff, day, period);

      const slot: TimeSlot = {
        day: DAYS[day],
        period,
        timeRange: getTimeRange(period),
        subject: subject.name,
        subjectCode: subject.code,
        staff: staff || "Unassigned",
        className: classSchedule.className,
      };

      classSchedule.schedule.push(slot);

      if (staff && staffSchedules.has(staff)) {
        staffSchedules.get(staff)!.push({ ...slot, subject: `${subject.name} (${classSchedule.className})` });
      }

      if (!staff) {
        unassignedSlots.push({ className: classSchedule.className, day: DAYS[day], period });
      }
    }
  }

  const staffTimetables: StaffTimetable[] = Array.from(staffSchedules).map(([staffName, schedule]) => ({
    staffName,
    schedule,
  }));

  if (unassignedSlots.length > 0) console.warn("⚠️ Unassigned Slots Detected:", unassignedSlots);

  return {
    classes: classSchedules,
    staff: staffTimetables,
    warnings: unassignedSlots,
  };
}
