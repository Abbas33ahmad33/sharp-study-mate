import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, UserX, UserCheck } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
}

const UsersManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: allRoles
          ?.filter((r) => r.user_id === profile.id)
          .map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(
        currentStatus ? "User blocked successfully" : "User activated successfully"
      );
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const toggleContentCreator = async (userId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "content_creator");

        if (error) throw error;
        toast.success("Content creator rights removed");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "content_creator" });

        if (error) throw error;
        toast.success("Content creator rights granted");
      }

      fetchUsers();
    } catch (error: any) {
      console.error("Error toggling content creator:", error);
      toast.error("Failed to update user role");
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Email</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Name</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Role</TableHead>
              <TableHead className="min-w-[90px] hidden lg:table-cell">Joined</TableHead>
              <TableHead className="min-w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isAdmin = user.roles.includes("admin");
              const isContentCreator = user.roles.includes("content_creator");

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="truncate max-w-[150px]">{user.email}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{user.full_name || "-"}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{user.full_name || "-"}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isAdmin ? (
                      <Badge variant="default" className="text-xs">Admin</Badge>
                    ) : isContentCreator ? (
                      <Badge variant="secondary" className="text-xs">Creator</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Student</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isAdmin && (
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className="text-xs"
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Block</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Activate</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant={isContentCreator ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            toggleContentCreator(user.id, isContentCreator)
                          }
                          className="text-xs"
                        >
                          {isContentCreator ? (
                            <>
                              <ShieldOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Remove</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Grant</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersManager;
