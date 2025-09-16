import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Clock, Users, Download } from "lucide-react";
import { ClassTimetable } from "@/types/timetable";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/use-toast";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface StudentTimetablesProps {
  timetableData?: { classes: ClassTimetable[] };
}

const StudentTimetables = ({ timetableData }: StudentTimetablesProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Student Timetables - EduSchedule",
    onAfterPrint: () => {
      toast({
        title: "Export Complete",
        description: "Student timetables have been exported to PDF successfully.",
      });
    },
  });
  if (!timetableData?.classes) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="space-y-4">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto" />
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
            <h1 className="text-4xl font-bold">Student Timetables</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Class schedules for all students
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              {timetableData.classes.length} Classes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              5 Days × 8 Periods
            </Badge>
            <Button onClick={handlePrint} className="bg-gradient-primary hover:opacity-90">
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print-content">
          {/* Print Header */}
          <div className="print-header hidden print:block mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Student Timetables</h1>
            <p className="text-lg text-gray-600">EduSchedule - Academic Year 2024-25</p>
            <div className="mt-4 text-sm text-gray-500">
              Generated on: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Timetables Grid */}
          <div className="grid gap-8">
            {timetableData.classes.map((classData, index) => (
              <Card key={index} className="shadow-card print:shadow-none print:border print:break-inside-avoid">
                <CardHeader className="print:pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold print:bg-gray-800">
                      {classData.className.split(" ")[1]}
                    </div>
                    {classData.className}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse print:text-sm">
                      <thead>
                        <tr>
                          <th className="border border-border p-3 bg-muted font-semibold text-left min-w-[120px] print:bg-gray-100 print:p-2">
                            Day / Period
                          </th>
                          {PERIODS.map(period => (
                            <th key={period} className="border border-border p-3 bg-muted text-center min-w-[140px] print:bg-gray-100 print:p-2 print:min-w-[100px]">
                              <div className="font-semibold">Period {period}</div>
                              <div className="text-xs text-muted-foreground print:text-gray-600">
                                {`${8 + period}:00-${9 + period}:00`}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map((day, dayIndex) => (
                          <tr key={day} className={dayIndex % 2 === 0 ? "bg-muted/20 print:bg-gray-50" : "print:bg-white"}>
                            <td className="border border-border p-3 font-medium bg-muted/50 print:bg-gray-100 print:p-2">
                              {day}
                            </td>
                            {PERIODS.map(period => {
                              const slot = classData.schedule[dayIndex]?.find(s => s.period === period);

                              return (
                                <td key={period} className="border border-border p-3 text-center print:p-2">
                                  {slot ? (
                                    <div className="space-y-1">
                                      <div className="font-semibold text-sm print:text-xs">{slot.subject}</div>
                                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 print:text-gray-600">
                                        <Users className="h-3 w-3 print:hidden" />
                                        <span className="print:text-xs">{slot.staff}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground text-sm print:text-gray-500 print:text-xs">Not Scheduled</div>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetables;