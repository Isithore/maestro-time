import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, GraduationCap } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      to: "/",
      label: "Generator",
      icon: Calendar,
      description: "Create Timetables"
    },
    {
      to: "/student-timetables",
      label: "Student View",
      icon: GraduationCap,
      description: "Class Schedules"
    },
    {
      to: "/staff-timetables",
      label: "Staff View",
      icon: Users,
      description: "Teacher Schedules"
    }
  ];

  return (
    <nav className="bg-card border-b shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EduSchedule
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2 h-auto py-2 px-4"
                  >
                    <Icon className="h-4 w-4" />
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;