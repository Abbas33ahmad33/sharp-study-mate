import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Users, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Institute {
  id: string;
  name: string;
  email: string;
  institute_code: string;
  is_active: boolean;
  created_at: string;
  _stats?: {
    students: number;
    exams: number;
  };
}

const InstitutesManager = () => {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from("institutes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stats for each institute
      const institutesWithStats = await Promise.all(
        (data || []).map(async (institute) => {
          const [studentsCount, examsCount] = await Promise.all([
            supabase
              .from("institute_students")
              .select("*", { count: "exact", head: true })
              .eq("institute_id", institute.id),
            supabase
              .from("institute_exams")
              .select("*", { count: "exact", head: true })
              .eq("institute_id", institute.id),
          ]);

          return {
            ...institute,
            _stats: {
              students: studentsCount.count || 0,
              exams: examsCount.count || 0,
            },
          };
        })
      );

      setInstitutes(institutesWithStats);
    } catch (error) {
      console.error("Error fetching institutes:", error);
      toast.error("Failed to load institutes");
    } finally {
      setLoading(false);
    }
  };

  const toggleInstituteStatus = async (instituteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("institutes")
        .update({ is_active: !currentStatus })
        .eq("id", instituteId);

      if (error) throw error;

      toast.success(
        currentStatus ? "Institute deactivated" : "Institute activated"
      );
      fetchInstitutes();
    } catch (error) {
      console.error("Error updating institute:", error);
      toast.error("Failed to update institute");
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading institutes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-bold">Institute Management</h2>
      </div>

      {institutes.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No institutes registered yet
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Institute</TableHead>
                <TableHead className="min-w-[150px] hidden md:table-cell">Email</TableHead>
                <TableHead className="min-w-[80px]">Code</TableHead>
                <TableHead className="min-w-[60px] hidden sm:table-cell">Students</TableHead>
                <TableHead className="min-w-[60px] hidden sm:table-cell">Exams</TableHead>
                <TableHead className="min-w-[70px]">Status</TableHead>
                <TableHead className="min-w-[80px] hidden lg:table-cell">Joined</TableHead>
                <TableHead className="min-w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.map((institute) => (
                <TableRow key={institute.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      <div>
                        <div className="text-sm">{institute.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{institute.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{institute.email}</TableCell>
                  <TableCell>
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      {institute.institute_code}
                    </code>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {institute._stats?.students || 0}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      {institute._stats?.exams || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={institute.is_active ? "default" : "secondary"} className="text-xs">
                      {institute.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {new Date(institute.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={institute.is_active ? "destructive" : "default"}
                      onClick={() =>
                        toggleInstituteStatus(institute.id, institute.is_active)
                      }
                      className="text-xs"
                    >
                      {institute.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default InstitutesManager;