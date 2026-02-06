import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, FolderOpen, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Chapter {
  id: string;
  name: string;
  description: string | null;
  subject_id: string;
  key_points: string[] | null;
  subjects: { name: string };
}

interface Subject {
  id: string;
  name: string;
}

interface ChaptersManagerProps {
  onUpdate?: () => void;
}

const ChaptersManager = ({ onUpdate }: ChaptersManagerProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", subject_id: "" });
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = useState("");

  useEffect(() => {
    fetchSubjects();
    fetchChapters();
  }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").order("name");
    setSubjects(data || []);
  };

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from("chapters")
      .select("*, subjects(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch chapters");
    } else {
      // Type assertion to include key_points
      setChapters((data as unknown as Chapter[]) || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingChapter) {
      const { error } = await supabase
        .from("chapters")
        .update({
          name: formData.name,
          description: formData.description,
          subject_id: formData.subject_id,
          key_points: keyPoints,
        } as any)
        .eq("id", editingChapter.id);

      if (error) {
        toast.error("Failed to update chapter");
      } else {
        toast.success("Chapter updated successfully");
        fetchChapters();
        onUpdate?.();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("chapters").insert({
        name: formData.name,
        description: formData.description,
        subject_id: formData.subject_id,
        created_by: user.id,
        key_points: keyPoints,
      } as any);

      if (error) {
        toast.error("Failed to create chapter");
      } else {
        toast.success("Chapter created successfully");
        fetchChapters();
        onUpdate?.();
        resetForm();
      }
    }
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setKeyPoints([...keyPoints, newKeyPoint.trim()]);
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const handleKeyPointKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyPoint();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all MCQs under this chapter.")) return;

    const { error } = await supabase.from("chapters").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete chapter");
    } else {
      toast.success("Chapter deleted successfully");
      fetchChapters();
      onUpdate?.();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", subject_id: "" });
    setKeyPoints([]);
    setNewKeyPoint("");
    setEditingChapter(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      name: chapter.name,
      description: chapter.description || "",
      subject_id: chapter.subject_id,
    });
    setKeyPoints(chapter.key_points || []);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Manage Chapters</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} disabled={subjects.length === 0} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-2 sm:mx-auto max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingChapter ? "Edit Chapter" : "Add New Chapter"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
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
                <Label htmlFor="name">Chapter Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Algebra"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the chapter"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyPoints">Key Points</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="keyPoints"
                    value={newKeyPoint}
                    onChange={(e) => setNewKeyPoint(e.target.value)}
                    onKeyDown={handleKeyPointKeyDown}
                    placeholder="Add a key point and press Enter"
                    className="min-h-[80px]"
                  />
                  <Button type="button" variant="outline" onClick={addKeyPoint} size="icon" className="h-auto">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keyPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1.5">
                        <Lightbulb className="h-3 w-3" />
                        {point}
                        <button
                          type="button"
                          onClick={() => removeKeyPoint(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingChapter ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Create a subject first before adding chapters.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="shadow-card hover:shadow-lg transition-smooth">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <FolderOpen className="w-5 h-5 text-secondary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{chapter.name}</h4>
                  <p className="text-xs text-primary">{chapter.subjects.name}</p>
                </div>
              </div>

              {chapter.key_points && chapter.key_points.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {chapter.key_points.slice(0, 3).map((point, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Lightbulb className="h-2.5 w-2.5 mr-1" />
                      {point}
                    </Badge>
                  ))}
                  {chapter.key_points.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{chapter.key_points.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(chapter)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(chapter.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chapters.length === 0 && subjects.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No chapters yet. Click "Add Chapter" to create one.
        </div>
      )}
    </div>
  );
};

export default ChaptersManager;