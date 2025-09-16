import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, BookOpen } from "lucide-react";
import { StaffTimetable } from "@/types/timetable";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface StaffTimetablesProps {
  timetableData?: { staff: StaffTimetable[] };
}

const StaffTimetables = ({ timetableData }: StaffTimetablesProps) => {
  if (!timetableData?.staff) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="space-y-4">
            <Users className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold text-muted-foreground">No Timetable Available</h2>
            <p className="text-muted-foreground">
              Please generate a timetable first from the Generator page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="bg-gradient-hero bg-clip-text text-transparent">
            <h1 className="text-4xl font-bold">Staff Timetables</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Individual schedules for teaching staff
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {timetableData.staff.length} Staff Members
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              5 Days × 8 Periods
            </Badge>
          </div>
        </div>

        {/* Timetables Grid */}
        <div className="grid gap-8">
          {timetableData.staff.map((staffData, index) => {
            // Calculate teaching load
            const totalPeriods = staffData.schedule.flat().filter(slot => 
              slot.subject && !slot.isBreak
            ).length;

            return (
              <Card key={index} className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                        {staffData.staffName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xl">{staffData.staffName}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Teaching Staff
                        </div>
                      </div>
                    </div>
                    <Badge className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {totalPeriods} periods/week
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-border p-3 bg-muted font-semibold text-left min-w-[120px]">
                            Day / Period
                          </th>
                          {PERIODS.map(period => (
                            <th key={period} className="border border-border p-3 bg-muted text-center min-w-[160px]">
                              <div className="font-semibold">Period {period}</div>
                              <div className="text-xs text-muted-foreground">
                                {period === 4 ? 'Lunch Break' : `${8 + period}:00-${8 + period + 1}:00`}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map((day, dayIndex) => (
                          <tr key={day} className={dayIndex % 2 === 0 ? 'bg-muted/20' : ''}>
                            <td className="border border-border p-3 font-medium bg-muted/50">
                              {day}
                            </td>
                            {PERIODS.map(period => {
                              const slot = staffData.schedule[dayIndex]?.find(s => s.period === period);
                              const isBreak = slot?.isBreak;
                              const subject = slot?.subject;
                              const className = slot?.className;

                              return (
                                <td key={period} className="border border-border p-3 text-center">
                                  {isBreak ? (
                                    <div className="text-muted-foreground font-medium">
                                      Lunch Break
                                    </div>
                                  ) : subject ? (
                                    <div className="space-y-1">
                                      <div className="font-semibold text-sm">{subject}</div>
                                      {className && (
                                        <div className="text-xs text-primary font-medium">
                                          {className}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground text-sm">Free</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StaffTimetables;