import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { TimetableData } from "@/types/timetable";

const StaffTimetables = () => {
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
          description: "Failed to load staff timetables from Firebase.",
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
    documentTitle: "Staff-Timetables",
    onAfterPrint: () => {
      toast({
        title: "Success!",
        description: "Staff timetables exported to PDF successfully.",
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

  if (!timetableData || !timetableData.staff || timetableData.staff.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Timetable Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please generate and save a timetable first from the generator page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Staff Timetables
            </h1>
            <p className="text-muted-foreground mt-2">
              {timetableData.staff.length} staff members • 5 days/week • 8 periods/day
            </p>
          </div>
          <Button onClick={handlePrint} size="lg" className="shadow-elevated">
            <FileDown className="h-5 w-5 mr-2" />
            Export to PDF
          </Button>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="space-y-8">
          {timetableData.staff.map((staffData, idx) => {
            // Calculate total periods safely
            const schedule = staffData.schedule || {};
            let totalPeriods = 0;
            
            Object.values(schedule).forEach((daySchedule: any) => {
              if (Array.isArray(daySchedule)) {
                totalPeriods += daySchedule.length;
              }
            });

            return (
              <Card
                key={idx}
                className="shadow-card print:shadow-none print:break-after-page"
              >
                <CardHeader className="bg-gradient-card print:bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2 print:text-foreground">
                        <Users className="h-6 w-6 text-primary print:hidden" />
                        {staffData.staffName || "Unknown Staff"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
                        Weekly Teaching Schedule
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className="print:border print:border-gray-300"
                      >
                        {totalPeriods} periods/week
                      </Badge>
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
                          <TableHead className="border text-center text-xs">
                            Time
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            08:00-09:00
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            09:00-09:50
                          </TableHead>
                          <TableHead className="border text-center text-xs bg-yellow-50 print:bg-gray-100">
                            BREAK
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            10:10-11:00
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            11:00-11:50
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            11:50-12:40
                          </TableHead>
                          <TableHead className="border text-center text-xs bg-orange-50 print:bg-gray-100">
                            LUNCH
                          </TableHead>
                          <TableHead className="border text-center text-xs">
                            01:30-02:20
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {DAYS.map((day) => {
                          const scheduleObj = staffData.schedule || {};
                          const daySchedule = scheduleObj[day] || [];
                          
                          const periods = Array(8)
                            .fill(null)
                            .map((_, periodIdx) => {
                              return Array.isArray(daySchedule)
                                ? daySchedule.find((slot) => slot && slot.period === periodIdx + 1)
                                : null;
                            });

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
                                      <div className="font-semibold text-xs">
                                        BREAK
                                      </div>
                                    </TableCell>
                                  );
                                }

                                if (isLunch) {
                                  return (
                                    <TableCell
                                      key={periodIdx}
                                      className="border text-center bg-orange-50 print:bg-gray-100"
                                    >
                                      <div className="font-semibold text-xs">
                                        LUNCH
                                      </div>
                                    </TableCell>
                                  );
                                }

                                if (slot && slot.subjectCode) {
                                  return (
                                    <TableCell
                                      key={periodIdx}
                                      className="border text-center p-2"
                                    >
                                      <div className="font-semibold text-sm">
                                        {slot.subjectCode}
                                      </div>
                                      <div className="text-xs text-muted-foreground print:text-gray-600">
                                        {slot.className || "N/A"}
                                      </div>
                                    </TableCell>
                                  );
                                }

                                return (
                                  <TableCell
                                    key={periodIdx}
                                    className="border text-center bg-green-50 print:bg-gray-50"
                                  >
                                    <span className="text-xs text-muted-foreground">
                                      Free
                                    </span>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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