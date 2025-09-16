import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import TimetableGenerator from "@/pages/TimetableGenerator";
import StudentTimetables from "@/pages/StudentTimetables";
import StaffTimetables from "@/pages/StaffTimetables";
import NotFound from "./pages/NotFound";
import { TimetableData } from "@/types/timetable";

const queryClient = new QueryClient();

const App = () => {
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen">
            <Navigation />
            <Routes>
              <Route 
                path="/" 
                element={<TimetableGenerator onTimetableGenerated={setTimetableData} />} 
              />
              <Route 
                path="/student-timetables" 
                element={<StudentTimetables timetableData={timetableData} />} 
              />
              <Route 
                path="/staff-timetables" 
                element={<StaffTimetables timetableData={timetableData} />} 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
