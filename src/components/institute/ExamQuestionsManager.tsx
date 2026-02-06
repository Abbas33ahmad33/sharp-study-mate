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
import { Plus, Trash2, Check, Upload, Download, Loader2 } from "lucide-react";
import { useRef } from "react";
import MathText from "@/components/MathText";

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const downloadTemplate = () => {
    const headers = "Question,Option A,Option B,Option C,Option D,Correct Option (A/B/C/D),Explanation (Optional)";
    const example = '"What is the capital of France?","Paris","London","Berlin","Madrid","A","Paris is the capital."';
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exam_mcq_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    // Handle both \n and \r\n line endings
    const lines = text.split(/\r?\n/);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts: string[] = [];
      let temp = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          // Handle escaped quotes ""
          if (inQuotes && line[j + 1] === '"') {
            temp += '"';
            j++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          parts.push(temp.trim());
          temp = '';
        } else {
          temp += char;
        }
      }
      parts.push(temp.trim());

      if (parts.length >= 6) {
        // Clean up any remaining quotes around the parts
        const cleanParts = parts.map(p => p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p);

        result.push({
          question: cleanParts[0],
          option_a: cleanParts[1],
          option_b: cleanParts[2],
          option_c: cleanParts[3],
          option_d: cleanParts[4],
          correct_option: cleanParts[5]?.toLowerCase().trim().charAt(0) || 'a',
          explanation: cleanParts[6] || null
        });
      }
    }
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsedMCQs = parseCSV(text);

        if (parsedMCQs.length === 0) {
          toast.error("No valid MCQs found in file");
          setIsUploading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const mcqDataArray = parsedMCQs.map(mcq => {
          // Robust correct option fallback: look for A, B, C, or D
          let correct = mcq.correct_option.toLowerCase().trim();
          if (correct.includes('a') || correct === '1') correct = 'a';
          else if (correct.includes('b') || correct === '2') correct = 'b';
          else if (correct.includes('c') || correct === '3') correct = 'c';
          else if (correct.includes('d') || correct === '4') correct = 'd';
          else correct = 'a';

          return {
            ...mcq,
            correct_option: correct,
            institute_id: instituteId,
            exam_id: examId,
            created_by: user.id
          };
        });

        const chunkSize = 50;
        let successCount = 0;
        let lastError = null;

        console.log(`Starting bulk upload of ${mcqDataArray.length} MCQs in chunks of ${chunkSize}`);

        for (let i = 0; i < mcqDataArray.length; i += chunkSize) {
          const chunk = mcqDataArray.slice(i, i + chunkSize);
          const { error } = await supabase.from("institute_mcqs").insert(chunk);

          if (error) {
            console.error(`Error uploading chunk ${i / chunkSize}:`, error);
            lastError = error;
          } else {
            successCount += chunk.length;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} MCQs!`);
          if (successCount < mcqDataArray.length) {
            toast.warning(`Some MCQs (${mcqDataArray.length - successCount}) failed to upload. Check console for details.`);
          }
          fetchInstituteMcqs();
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          toast.error(`Failed to upload MCQs: ${lastError?.message || "Check file format"}`);
        }
      } catch (error: any) {
        console.error("Upload error details:", error);
        toast.error(`Error processing file: ${error.message || "Unknown error"}`);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
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
                          <TableCell className="text-sm max-w-[300px] truncate">
                            <MathText text={mcq.question} />
                          </TableCell>
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
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Custom Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CSV UPLOAD SECTION */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-4 mb-6">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-primary opacity-50" />
                  <h3 className="font-bold text-lg text-primary">Bulk Import via CSV</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Save time by uploading hundreds of MCQs at once for this exam.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" /> Template
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Select CSV File
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              <form onSubmit={handleAddCustomQuestion} className="space-y-4 pt-4">
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words leading-relaxed">
                            Q{index + 1}: <MathText text={mcq.question} />
                          </p>
                        </div>
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
                          A: <MathText text={mcq.option_a} />
                        </p>
                        <p className={mcq.correct_option === "b" ? "text-green-600 font-medium" : ""}>
                          B: <MathText text={mcq.option_b} />
                        </p>
                        <p className={mcq.correct_option === "c" ? "text-green-600 font-medium" : ""}>
                          C: <MathText text={mcq.option_c} />
                        </p>
                        <p className={mcq.correct_option === "d" ? "text-green-600 font-medium" : ""}>
                          D: <MathText text={mcq.option_d} />
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