import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";

interface ExamQuestionsManagerProps {
  examId: string;
  instituteId: string;
  onClose: () => void;
}

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  subject_id: string;
}

interface MCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  chapter_id: string;
}

interface InstituteMCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
}

export const ExamQuestionsManager = ({
  examId,
  instituteId,
  onClose,
}: ExamQuestionsManagerProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedMcqs, setSelectedMcqs] = useState<Set<string>>(new Set());
  const [instituteMcqs, setInstituteMcqs] = useState<InstituteMCQ[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom question form
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    fetchSubjects();
    fetchExistingSelections();
    fetchInstituteMcqs();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      fetchMcqs(selectedChapter);
    }
  }, [selectedChapter]);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");
    setSubjects(data || []);
  };

  const fetchChapters = async (subjectId: string) => {
    const { data } = await supabase
      .from("chapters")
      .select("id, name, subject_id")
      .eq("subject_id", subjectId)
      .order("order_index");
    setChapters(data || []);
  };

  const fetchMcqs = async (chapterId: string) => {
    const { data } = await supabase
      .from("mcqs")
      .select("id, question, option_a, option_b, option_c, option_d, correct_option, chapter_id")
      .eq("chapter_id", chapterId);
    setMcqs(data || []);
  };

  const fetchExistingSelections = async () => {
    const { data } = await supabase
      .from("exam_mcqs")
      .select("mcq_id")
      .eq("exam_id", examId);
    
    if (data) {
      setSelectedMcqs(new Set(data.map((d) => d.mcq_id)));
    }
  };

  const fetchInstituteMcqs = async () => {
    const { data } = await supabase
      .from("institute_mcqs")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at");
    setInstituteMcqs(data || []);
  };

  const toggleMcqSelection = async (mcqId: string) => {
    const newSelected = new Set(selectedMcqs);
    
    if (newSelected.has(mcqId)) {
      // Remove from exam
      const { error } = await supabase
        .from("exam_mcqs")
        .delete()
        .eq("exam_id", examId)
        .eq("mcq_id", mcqId);
      
      if (!error) {
        newSelected.delete(mcqId);
        toast.success("Question removed from exam");
      }
    } else {
      // Add to exam
      const { error } = await supabase
        .from("exam_mcqs")
        .insert({
          exam_id: examId,
          mcq_id: mcqId,
          order_index: selectedMcqs.size,
        });
      
      if (!error) {
        newSelected.add(mcqId);
        toast.success("Question added to exam");
      }
    }
    
    setSelectedMcqs(newSelected);
  };

  const handleAddCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("institute_mcqs").insert({
        institute_id: instituteId,
        exam_id: examId,
        question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        explanation: explanation || null,
        created_by: user!.id,
      });

      if (error) throw error;

      toast.success("Custom question added!");
      setQuestion("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectOption("");
      setExplanation("");
      fetchInstituteMcqs();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomQuestion = async (id: string) => {
    const { error } = await supabase
      .from("institute_mcqs")
      .delete()
      .eq("id", id);

    if (!error) {
      toast.success("Question deleted");
      fetchInstituteMcqs();
    }
  };

  const totalQuestions = selectedMcqs.size + instituteMcqs.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Manage Exam Questions</h2>
          <p className="text-sm text-muted-foreground">
            Total questions: {totalQuestions} ({selectedMcqs.size} from bank + {instituteMcqs.length} custom)
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList className="w-full flex">
          <TabsTrigger value="bank" className="flex-1">Select from Bank</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Add Custom</TabsTrigger>
          <TabsTrigger value="review" className="flex-1">Review ({totalQuestions})</TabsTrigger>
        </TabsList>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Questions from MCQ Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select
                    value={selectedChapter}
                    onValueChange={setSelectedChapter}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mcqs.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Add</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="hidden md:table-cell">Correct</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mcqs.map((mcq) => (
                        <TableRow key={mcq.id}>
                          <TableCell>
                            <Button
                              size="icon"
                              variant={selectedMcqs.has(mcq.id) ? "default" : "outline"}
                              onClick={() => toggleMcqSelection(mcq.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">{mcq.question}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            Option {mcq.correct_option.toUpperCase()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedChapter && mcqs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No questions found in this chapter
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Custom Question</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCustomQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input
                      placeholder="Option A"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input
                      placeholder="Option B"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input
                      placeholder="Option C"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input
                      placeholder="Option D"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select value={correctOption} onValueChange={setCorrectOption} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Option A</SelectItem>
                      <SelectItem value="b">Option B</SelectItem>
                      <SelectItem value="c">Option C</SelectItem>
                      <SelectItem value="d">Option D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Explain why this is the correct answer..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading || !correctOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Adding..." : "Add Question"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Questions ({instituteMcqs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {instituteMcqs.length > 0 ? (
                <div className="space-y-4">
                  {instituteMcqs.map((mcq, index) => (
                    <div key={mcq.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">Q{index + 1}: {mcq.question}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteCustomQuestion(mcq.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className={mcq.correct_option === "a" ? "text-green-600 font-medium" : ""}>
                          A: {mcq.option_a}
                        </p>
                        <p className={mcq.correct_option === "b" ? "text-green-600 font-medium" : ""}>
                          B: {mcq.option_b}
                        </p>
                        <p className={mcq.correct_option === "c" ? "text-green-600 font-medium" : ""}>
                          C: {mcq.option_c}
                        </p>
                        <p className={mcq.correct_option === "d" ? "text-green-600 font-medium" : ""}>
                          D: {mcq.option_d}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No custom questions added yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};