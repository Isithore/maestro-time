import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  
  const [numClasses, setNumClasses] = useState(3);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', code: 'MATH101', staff: ['Mr. Smith'], isLab: false, duration: 1 },
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
    if (subject) {
      updateSubject(subjectId, { staff: [...subject.staff, ''] });
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

  const handleGenerate = () => {
    // Validation
    const validSubjects = subjects.filter(s => s.name.trim() && s.staff.some(staff => staff.trim()));
    
    if (validSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid subject with staff member.",
        variant: "destructive"
      });
      return;
    }

    if (numClasses < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number of classes.",
        variant: "destructive"
      });
      return;
    }

    const input: GeneratorInput = {
      numClasses,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numClasses">Number of Classes</Label>
                  <Input
                    id="numClasses"
                    type="number"
                    min="1"
                    max="26"
                    value={numClasses}
                    onChange={(e) => setNumClasses(parseInt(e.target.value) || 1)}
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
                <Badge variant="secondary">Classes: A-{String.fromCharCode(64 + numClasses)}</Badge>
                <Badge variant="outline">Monday-Friday</Badge>
                <Badge variant="outline">8 Periods/Day</Badge>
                <Badge variant="outline">No Free Periods</Badge>
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
                          <Input
                            placeholder="Staff member name"
                            value={staff}
                            onChange={(e) => updateStaffMember(subject.id, index, e.target.value)}
                            className="flex-1"
                          />
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
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff Member
                      </Button>
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