import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimetableData } from "@/types/timetable";
import { FileDown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const StudentTimetables = () => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const docRef = doc(db, "timetables", "latest");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          // Extract the nested 'data' property which contains the actual timetable
          const actualTimetableData = fetchedData.data || fetchedData;
          setTimetableData(actualTimetableData as TimetableData);
        } else {
          toast({
            title: "No Timetable Found",
            description: "Please generate and save a timetable first.",
          });
        }
      } catch (error) {
        console.error("Error fetching timetable:", error);
        toast({
          title: "Error",
          description: "Failed to fetch timetables from Firebase.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [toast]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Student-Timetables",
    onAfterPrint: () => {
      toast({
        title: "Success!",
        description: "Timetable exported to PDF successfully.",
      });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Loading Timetables...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Fetching data from Firebase...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!timetableData || !timetableData.classes || timetableData.classes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Timetable Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please generate a timetable first from the generator page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build subject legend safely
  const subjectMap = new Map<string, { name: string; code: string; staff: Set<string> }>();
  
  timetableData.classes.forEach((classData) => {
    // classData.schedule is an object keyed by day names
    const schedule = classData.schedule || {};
    Object.values(schedule).forEach((daySchedule: any) => {
      if (Array.isArray(daySchedule)) {
        daySchedule.forEach((slot) => {
          if (slot && slot.subjectCode) {
            if (!subjectMap.has(slot.subjectCode)) {
              subjectMap.set(slot.subjectCode, {
                name: slot.subject || slot.subjectCode,
                code: slot.subjectCode,
                staff: new Set([slot.staff || "Unassigned"]),
              });
            } else {
              const existing = subjectMap.get(slot.subjectCode);
              if (existing && slot.staff) {
                existing.staff.add(slot.staff);
              }
            }
          }
        });
      }
    });
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Student Class Timetables
            </h1>
            <p className="text-muted-foreground mt-2">
              {timetableData.classes.length} classes • 5 days/week • 8 periods/day
            </p>
          </div>
          <Button onClick={handlePrint} size="lg" className="shadow-elevated">
            <FileDown className="h-5 w-5 mr-2" />
            Export to PDF
          </Button>
        </div>

        <div ref={printRef} className="space-y-8">
          {timetableData.classes.map((classData, idx) => (
            <Card key={idx} className="shadow-card print:shadow-none print:break-after-page">
              <CardHeader className="bg-gradient-card print:bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2 print:text-foreground">
                      <Calendar className="h-6 w-6 text-primary print:hidden" />
                      {classData.department} - Year {classData.year} - Section {classData.section}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
                      Complete Weekly Schedule
                    </p>
                  </div>
                  <div className="print:block hidden text-right text-sm">
                    <p className="font-semibold">LOYOLA-ICAM</p>
                    <p>COLLEGE OF ENGINEERING AND TECHNOLOGY</p>
                    <p className="text-xs text-muted-foreground">Academic Year: 2025-26</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="font-bold border text-center w-32">
                          Day / Period
                        </TableHead>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                          <TableHead
                            key={period}
                            className="font-bold border text-center min-w-[120px]"
                          >
                            {period}
                          </TableHead>
                        ))}
                      </TableRow>
                      <TableRow className="bg-muted/50">
                        <TableHead className="border text-center text-xs">Time</TableHead>
                        <TableHead className="border text-center text-xs">08:00-09:00</TableHead>
                        <TableHead className="border text-center text-xs">09:00-09:50</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 print:bg-gray-100">
                          BREAK
                        </TableHead>
                        <TableHead className="border text-center text-xs">10:10-11:00</TableHead>
                        <TableHead className="border text-center text-xs">11:00-11:50</TableHead>
                        <TableHead className="border text-center text-xs">11:50-12:40</TableHead>
                        <TableHead className="border text-center text-xs bg-orange-50 print:bg-gray-100">
                          LUNCH
                        </TableHead>
                        <TableHead className="border text-center text-xs">01:30-02:20</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {DAYS.map((day) => {
                        const schedule = classData.schedule || {};
                        const daySchedule = schedule[day] || [];
                        const periods = Array(8)
                          .fill(null)
                          .map((_, periodIdx) =>
                            Array.isArray(daySchedule) 
                              ? daySchedule.find((slot) => slot && slot.period === periodIdx + 1)
                              : null
                          );

                        return (
                          <TableRow key={day}>
                            <TableCell className="font-semibold border bg-muted">
                              {day.substring(0, 3).toUpperCase()}
                            </TableCell>
                            {periods.map((slot, periodIdx) => {
                              const period = periodIdx + 1;
                              const isBreak = period === 3;
                              const isLunch = period === 7;

                              if (isBreak) {
                                return (
                                  <TableCell
                                    key={periodIdx}
                                    className="border text-center bg-yellow-50 print:bg-gray-100"
                                  >
                                    <div className="font-semibold text-xs">BREAK</div>
                                  </TableCell>
                                );
                              }

                              if (isLunch) {
                                return (
                                  <TableCell
                                    key={periodIdx}
                                    className="border text-center bg-orange-50 print:bg-gray-100"
                                  >
                                    <div className="font-semibold text-xs">LUNCH</div>
                                  </TableCell>
                                );
                              }

                              if (slot && slot.subjectCode) {
                                return (
                                  <TableCell key={periodIdx} className="border text-center p-2">
                                    <div className="font-semibold text-sm">{slot.subjectCode}</div>
                                    <div className="text-xs text-muted-foreground print:text-gray-600">
                                      {slot.subject && `[${slot.subject}]`}
                                    </div>
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={periodIdx} className="border text-center">
                                  <span className="text-xs text-muted-foreground">-</span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Course Legend */}
                {subjectMap.size > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold mb-3">Course Details:</h3>
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="border font-bold">Course Code</TableHead>
                          <TableHead className="border font-bold">Course Name</TableHead>
                          <TableHead className="border font-bold">Faculty Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from(subjectMap.entries()).map(([code, info]) => (
                          <TableRow key={code}>
                            <TableCell className="border font-medium">{code}</TableCell>
                            <TableCell className="border">{info.name}</TableCell>
                            <TableCell className="border">{Array.from(info.staff).join(", ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentTimetables;