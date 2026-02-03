import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Edit, Trash2, FileQuestion, Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  chapter_id: string;
  chapters: {
    name: string;
    subjects: { name: string };
  };
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

interface MCQsManagerProps {
  onUpdate?: () => void;
}

const MCQsManager = ({ onUpdate }: MCQsManagerProps) => {
  const { userRole, user } = useAuth();
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);
  const [batchSubjectId, setBatchSubjectId] = useState("");
  const [batchChapterId, setBatchChapterId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mcqForms, setMcqForms] = useState([{
    id: crypto.randomUUID(),
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  }]);

  useEffect(() => {
    fetchSubjects();
    fetchChapters();
    fetchMCQs();
  }, []);

  useEffect(() => {
    if (batchSubjectId) {
      setFilteredChapters(chapters.filter((c) => c.subject_id === batchSubjectId));
    } else {
      setFilteredChapters([]);
    }
  }, [batchSubjectId, chapters]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").order("name");
    setSubjects(data || []);
  };

  const fetchChapters = async () => {
    const { data } = await supabase.from("chapters").select("id, name, subject_id").order("name");
    setChapters(data || []);
  };

  const fetchMCQs = async () => {
    let query = supabase
      .from("mcqs")
      .select("*, chapters(name, subjects(name))")
      .order("created_at", { ascending: false });

    if (userRole === "content_creator" && user) {
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch MCQs");
    } else {
      setMcqs(data || []);
    }
  };

  const downloadTemplate = () => {
    const headers = "Question,Option A,Option B,Option C,Option D,Correct Option (A/B/C/D)";
    const example = '"What is the capital of France?","Paris","London","Berlin","Madrid","A"';
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mcq_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const result = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Regex to split by comma but ignore commas inside quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

      // Handling clearer CSV splitting manually to be robust against "Option A, B" cases
      // A simple robust splitter for standard CSV
      const parts: string[] = [];
      let temp = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(temp.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
          temp = '';
        } else {
          temp += char;
        }
      }
      parts.push(temp.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 6) {
        result.push({
          question: parts[0],
          option_a: parts[1],
          option_b: parts[2],
          option_c: parts[3],
          option_d: parts[4],
          correct_option: parts[5].toUpperCase().replace(/[^A-D]/g, 'A') || 'A' // Default to A if invalid
        });
      }
    }
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !batchChapterId) {
      toast.error("Please select a chapter first");
      return;
    }

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

        // Batch insert
        const mcqDataArray = parsedMCQs.map(mcq => ({
          ...mcq,
          chapter_id: batchChapterId,
          created_by: user.id
        }));

        // Insert in chunks of 50 to avoid payload limits
        const chunkSize = 50;
        let successCount = 0;

        for (let i = 0; i < mcqDataArray.length; i += chunkSize) {
          const chunk = mcqDataArray.slice(i, i + chunkSize);
          const { error } = await supabase.from("mcqs").insert(chunk);
          if (!error) successCount += chunk.length;
        }

        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} MCQs!`);
          fetchMCQs();
          onUpdate?.();
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          toast.error("Failed to upload MCQs");
        }

      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error processing file");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingMCQ) {
      const firstForm = mcqForms[0];
      const mcqData = {
        question: firstForm.question,
        option_a: firstForm.option_a,
        option_b: firstForm.option_b,
        option_c: firstForm.option_c,
        option_d: firstForm.option_d,
        correct_option: firstForm.correct_option,
        chapter_id: batchChapterId,
      };

      const { error } = await supabase.from("mcqs").update(mcqData).eq("id", editingMCQ.id);

      if (error) {
        toast.error("Failed to update MCQ");
      } else {
        toast.success("MCQ updated successfully");
        fetchMCQs();
        onUpdate?.();
        resetForm();
      }
    } else {
      const mcqDataArray = mcqForms.map(form => ({
        question: form.question,
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_option: form.correct_option,
        chapter_id: batchChapterId,
        created_by: user.id,
      }));

      const { error } = await supabase.from("mcqs").insert(mcqDataArray);

      if (error) {
        toast.error("Failed to create MCQs");
      } else {
        toast.success(`${mcqForms.length} MCQ(s) created successfully`);
        fetchMCQs();
        onUpdate?.();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this MCQ?")) return;

    const { error } = await supabase.from("mcqs").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete MCQ");
    } else {
      toast.success("MCQ deleted successfully");
      fetchMCQs();
      onUpdate?.();
    }
  };

  const resetForm = () => {
    setBatchSubjectId("");
    setBatchChapterId("");
    setMcqForms([{
      id: crypto.randomUUID(),
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    }]);
    setEditingMCQ(null);
    setIsDialogOpen(false);
  };

  const addMcqForm = () => {
    setMcqForms([...mcqForms, {
      id: crypto.randomUUID(),
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    }]);
  };

  const removeMcqForm = (id: string) => {
    if (mcqForms.length > 1) {
      setMcqForms(mcqForms.filter(form => form.id !== id));
    }
  };

  const updateMcqForm = (id: string, field: string, value: string) => {
    setMcqForms(mcqForms.map(form =>
      form.id === id ? { ...form, [field]: value } : form
    ));
  };

  const handleEdit = (mcq: MCQ) => {
    const chapter = chapters.find((c) => c.id === mcq.chapter_id);
    setEditingMCQ(mcq);
    setBatchSubjectId(chapter?.subject_id || "");
    setBatchChapterId(mcq.chapter_id);
    setMcqForms([{
      id: crypto.randomUUID(),
      question: mcq.question,
      option_a: mcq.option_a,
      option_b: mcq.option_b,
      option_c: mcq.option_c,
      option_d: mcq.option_d,
      correct_option: mcq.correct_option,
    }]);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input for CSV Upload */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Manage MCQs</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} disabled={chapters.length === 0} size="sm" className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-2 sm:mx-auto max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMCQ ? "Edit MCQ" : "Add MCQs (Batch)"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject and Chapter selection - Fixed at top */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={batchSubjectId}
                      onValueChange={(value) => {
                        setBatchSubjectId(value);
                        setBatchChapterId("");
                      }}
                      disabled={editingMCQ !== null}
                    >
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
                    <Label htmlFor="chapter">Chapter *</Label>
                    <Select
                      value={batchChapterId}
                      onValueChange={setBatchChapterId}
                      disabled={!batchSubjectId || editingMCQ !== null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredChapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CSV UPLOAD SECTION */}
                {!editingMCQ && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-4">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-primary opacity-50" />
                      <h3 className="font-bold text-lg text-primary">Bulk Import via CSV</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Save time by uploading hundreds of MCQs at once. Select a chapter above, then upload your file.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadTemplate}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" /> Download Template
                      </Button>
                      <Button
                        type="button"
                        onClick={() => !batchChapterId ? toast.error("Select a chapter first!") : fileInputRef.current?.click()}
                        disabled={isUploading || !batchChapterId}
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
                    {!batchChapterId && (
                      <p className="text-xs text-destructive font-medium animate-pulse">
                        * Please select a Subject & Chapter first
                      </p>
                    )}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                  </div>
                </div>

                {/* Multiple MCQ forms */}
                <div className="space-y-6">
                  {mcqForms.map((form, index) => (
                    <div key={form.id} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">MCQ #{index + 1}</Label>
                        {!editingMCQ && mcqForms.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMcqForm(form.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Question *</Label>
                        <Textarea
                          value={form.question}
                          onChange={(e) => updateMcqForm(form.id, "question", e.target.value)}
                          placeholder="Enter the question"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Options *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Option A"
                            value={form.option_a}
                            onChange={(e) => updateMcqForm(form.id, "option_a", e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Option B"
                            value={form.option_b}
                            onChange={(e) => updateMcqForm(form.id, "option_b", e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Option C"
                            value={form.option_c}
                            onChange={(e) => updateMcqForm(form.id, "option_c", e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Option D"
                            value={form.option_d}
                            onChange={(e) => updateMcqForm(form.id, "option_d", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Correct Answer *</Label>
                        <RadioGroup
                          value={form.correct_option}
                          onValueChange={(value) => updateMcqForm(form.id, "correct_option", value)}
                        >
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="A" id={`opt-a-${form.id}`} />
                              <Label htmlFor={`opt-a-${form.id}`}>A</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="B" id={`opt-b-${form.id}`} />
                              <Label htmlFor={`opt-b-${form.id}`}>B</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="C" id={`opt-c-${form.id}`} />
                              <Label htmlFor={`opt-c-${form.id}`}>C</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="D" id={`opt-d-${form.id}`} />
                              <Label htmlFor={`opt-d-${form.id}`}>D</Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  ))}

                  {!editingMCQ && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMcqForm}
                      className="w-full"
                      disabled={!batchChapterId}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another MCQ (Manual)
                    </Button>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!batchChapterId} className="w-full sm:w-auto">
                    {editingMCQ ? "Update" : `Create ${mcqForms.length} MCQ${mcqForms.length > 1 ? "s" : ""}`}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Create subjects and chapters first before adding MCQs.
        </div>
      )}

      <div className="space-y-4">
        {mcqs.map((mcq) => (
          <Card key={mcq.id} className="shadow-card hover:shadow-lg transition-smooth">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileQuestion className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{mcq.question}</p>
                      <p className="text-xs text-muted-foreground">
                        {mcq.chapters.subjects.name} → {mcq.chapters.name}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(mcq)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(mcq.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className={`p-2 rounded text-xs sm:text-sm ${mcq.correct_option === "A" ? "bg-success/10 border border-success" : "bg-muted"}`}>
                      A. {mcq.option_a}
                    </div>
                    <div className={`p-2 rounded text-xs sm:text-sm ${mcq.correct_option === "B" ? "bg-success/10 border border-success" : "bg-muted"}`}>
                      B. {mcq.option_b}
                    </div>
                    <div className={`p-2 rounded text-xs sm:text-sm ${mcq.correct_option === "C" ? "bg-success/10 border border-success" : "bg-muted"}`}>
                      C. {mcq.option_c}
                    </div>
                    <div className={`p-2 rounded text-xs sm:text-sm ${mcq.correct_option === "D" ? "bg-success/10 border border-success" : "bg-muted"}`}>
                      D. {mcq.option_d}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mcqs.length === 0 && chapters.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No MCQs yet. Click "Add Manually" or Upload CSV to create one.
        </div>
      )}
    </div>
  );
};

export default MCQsManager;