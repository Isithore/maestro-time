import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calendar, Users, BookOpen } from "lucide-react";
import { Subject, GeneratorInput } from "@/types/timetable";
import { generateTimetable } from "@/utils/timetableGenerator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TimetableGeneratorProps {
  onTimetableGenerated: (data: any) => void;
}

const TimetableGenerator = ({ onTimetableGenerated }: TimetableGeneratorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const AVAILABLE_DEPARTMENTS = ['CSE', 'IT', 'MECH', 'EEE', 'ECE', 'AIDS'];
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['CSE']);
  const [yearsPerDepartment] = useState(4);
  const [sectionsPerYear, setSectionsPerYear] = useState(1);
  
  // Staff Management
  const [staffList, setStaffList] = useState<string[]>([
    'Dr. Smith',
    'Dr. Johnson',
    'Ms. Davis',
    'Prof. Williams',
    'Dr. Brown'
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', code: 'MATH101', staff: ['Dr. Smith'], isLab: false, duration: 1 },
    { id: '2', name: 'Physics', code: 'PHY101', staff: ['Dr. Johnson'], isLab: false, duration: 1 },
    { id: '3', name: 'Chemistry Lab', code: 'CHEM102', staff: ['Ms. Davis'], isLab: true, duration: 2 },
  ]);
  const [daysPerWeek] = useState(5);
  const [periodsPerDay] = useState(8);

  const addSubject = () => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: '',
      code: '',
      staff: [''],
      isLab: false,
      duration: 1,
    };
    setSubjects([...subjects, newSubject]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addStaffMember = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && staffList.length > 0) {
      // Add first available staff member not already assigned
      const availableStaff = staffList.find(s => !subject.staff.includes(s)) || staffList[0];
      updateSubject(subjectId, { staff: [...subject.staff, availableStaff] });
    }
  };

  const updateStaffMember = (subjectId: string, staffIndex: number, value: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const newStaff = [...subject.staff];
      newStaff[staffIndex] = value;
      updateSubject(subjectId, { staff: newStaff });
    }
  };

  const removeStaffMember = (subjectId: string, staffIndex: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && subject.staff.length > 1) {
      const newStaff = subject.staff.filter((_, index) => index !== staffIndex);
      updateSubject(subjectId, { staff: newStaff });
    }
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  // Staff Management Functions
  const addStaffToList = () => {
    const trimmedName = newStaffName.trim();
    if (trimmedName && !staffList.includes(trimmedName)) {
      setStaffList([...staffList, trimmedName]);
      setNewStaffName('');
      toast({
        title: "Success",
        description: `${trimmedName} added to staff list.`,
      });
    } else if (staffList.includes(trimmedName)) {
      toast({
        title: "Error",
        description: "This staff member already exists.",
        variant: "destructive"
      });
    }
  };

  const removeStaffFromList = (staffName: string) => {
    setStaffList(staffList.filter(s => s !== staffName));
    // Also remove from subjects
    setSubjects(subjects.map(subject => ({
      ...subject,
      staff: subject.staff.filter(s => s !== staffName)
    })));
    toast({
      title: "Removed",
      description: `${staffName} removed from staff list.`,
    });
  };

  const handleGenerate = () => {
    // Validation
    if (selectedDepartments.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one department.",
        variant: "destructive"
      });
      return;
    }

    const validSubjects = subjects.filter(s => s.name.trim() && s.staff.some(staff => staff.trim()));
    
    if (validSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid subject with staff member.",
        variant: "destructive"
      });
      return;
    }

    const input: GeneratorInput = {
      departments: selectedDepartments,
      yearsPerDepartment,
      sectionsPerYear,
      subjects: validSubjects,
      daysPerWeek,
      periodsPerDay,
    };

    try {
      const timetableData = generateTimetable(input);
      onTimetableGenerated(timetableData);
      
      toast({
        title: "Success!",
        description: "Timetable generated successfully.",
        variant: "default"
      });

      navigate('/student-timetables');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate timetable. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="bg-gradient-hero bg-clip-text text-transparent">
            <h1 className="text-4xl font-bold">Timetable Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create optimized schedules for classes and staff with smart conflict resolution
          </p>
        </div>

        {/* Configuration Cards */}
        <div className="grid gap-6">
          {/* Basic Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Set up your school's basic schedule parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Departments</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_DEPARTMENTS.map(dept => (
                    <div
                      key={dept}
                      onClick={() => toggleDepartment(dept)}
                      className={`
                        cursor-pointer p-3 rounded-lg border-2 transition-all
                        ${selectedDepartments.includes(dept)
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{dept}</span>
                        <Checkbox
                          checked={selectedDepartments.includes(dept)}
                          onCheckedChange={() => toggleDepartment(dept)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {selectedDepartments.length === 0 && (
                  <p className="text-sm text-destructive">Please select at least one department</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sections">Sections per Year</Label>
                  <Input
                    id="sections"
                    type="number"
                    min="1"
                    max="10"
                    value={sectionsPerYear}
                    onChange={(e) => setSectionsPerYear(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Days per Week</Label>
                  <Input value={daysPerWeek} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Periods per Day</Label>
                  <Input value={periodsPerDay} disabled />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedDepartments.length} Department{selectedDepartments.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="outline">{yearsPerDepartment} Years</Badge>
                <Badge variant="outline">Sections: A-{String.fromCharCode(64 + sectionsPerYear)}</Badge>
                <Badge variant="outline">Monday-Friday</Badge>
                <Badge variant="outline">8 Periods/Day</Badge>
                <Badge variant="secondary">Total Classes: {selectedDepartments.length * yearsPerDepartment * sectionsPerYear}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Staff Management */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Management
              </CardTitle>
              <CardDescription>
                Manage your college staff list for easy assignment to subjects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Staff */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter staff name (e.g., Dr. John Smith)"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStaffToList()}
                  className="flex-1"
                />
                <Button onClick={addStaffToList} disabled={!newStaffName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </div>

              {/* Staff List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Staff List ({staffList.length} members)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                  {staffList.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                      No staff members added yet. Add staff to assign them to subjects.
                    </p>
                  ) : (
                    staffList.map((staff, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-background p-2 rounded border"
                      >
                        <span className="text-sm font-medium">{staff}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStaffFromList(staff)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Subjects & Staff
              </CardTitle>
              <CardDescription>
                Define your subjects and assign teaching staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                          placeholder="Subject name"
                          value={subject.name}
                          onChange={(e) => updateSubject(subject.id, { name: e.target.value })}
                        />
                        <Input
                          placeholder="Course code (e.g., CS3591)"
                          value={subject.code}
                          onChange={(e) => updateSubject(subject.id, { code: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`lab-${subject.id}`}
                            checked={subject.isLab}
                            onCheckedChange={(checked) => 
                              updateSubject(subject.id, { 
                                isLab: !!checked, 
                                duration: checked ? 2 : 1 
                              })
                            }
                          />
                          <Label htmlFor={`lab-${subject.id}`} className="text-sm">
                            Lab Subject
                          </Label>
                        </div>
                      </div>
                      {subject.isLab && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Duration:</Label>
                          <Input
                            type="number"
                            min="2"
                            max="4"
                            value={subject.duration}
                            onChange={(e) => updateSubject(subject.id, { duration: parseInt(e.target.value) || 2 })}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">periods</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSubject(subject.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Teaching Staff
                    </Label>
                    <div className="space-y-2">
                      {subject.staff.map((staff, index) => (
                        <div key={index} className="flex gap-2">
                          <Select
                            value={staff}
                            onValueChange={(value) => updateStaffMember(subject.id, index, value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffList.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  No staff available. Add staff first.
                                </div>
                              ) : (
                                staffList.map((staffMember) => (
                                  <SelectItem key={staffMember} value={staffMember}>
                                    {staffMember}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {subject.staff.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeStaffMember(subject.id, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addStaffMember(subject.id)}
                        className="w-full"
                        disabled={staffList.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff Member
                      </Button>
                      {staffList.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Add staff members above to assign them here
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addSubject}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="text-center">
            <Button
              onClick={handleGenerate}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-smooth px-8 py-3 text-lg font-semibold shadow-elevated"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Generate Timetable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGenerator;