import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Search, Users, XCircle } from "lucide-react";
import { getGlobalUsers, updateGlobalUserStatus } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { GlobalUser } from "@/types";

export default function UniversalUsersDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGlobalUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getGlobalUsers();
      if ((res.status === "success" || res.status === true) && res.data) {
        setUsers(res.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load global users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGlobalUsers();
  }, [fetchGlobalUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const email = user.email?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";
      const id = user.global_user_id?.toLowerCase() || "";
      return email.includes(query) || username.includes(query) || id.includes(query);
    });
  }, [searchQuery, users]);

  const handleGlobalStatusChange = async (globalUserId: string, status: "Active" | "Suspended") => {
    try {
      const res = await updateGlobalUserStatus(globalUserId, status);
      if (res.status === "success" || res.status === true) {
        toast({
          title: "Status Updated",
          description: `User status changed to ${status}.`,
          variant: "success",
        });
        await fetchGlobalUsers();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const suspendedUsers = users.filter((user) => user.status === "Suspended").length;
  const totalVisas = users.reduce((count, user) => count + (user.visas?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Global Users Management</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage identities and product access across all satellite applications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Global Users</p>
              <h3 className="text-2xl font-bold text-primary">{users.length}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active</p>
              <h3 className="text-2xl font-bold text-primary">{activeUsers}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Suspended</p>
              <h3 className="text-2xl font-bold text-accent">{suspendedUsers}</h3>
            </div>
            <div className="bg-accent/10 p-2 rounded-md">
              <AlertCircle className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Visas</p>
              <h3 className="text-2xl font-bold text-primary">{totalVisas}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Global Users
          </CardTitle>
          <CardDescription className="mt-1">
            Manage users who are not associated with any specific company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 mb-6">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search users by email, username, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11 border-gray-200 focus:border-primary/20 focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold">User Info</TableHead>
                  <TableHead className="font-semibold">Global ID</TableHead>
                  <TableHead className="font-semibold">Product Access (Visas)</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <RotateCcw className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-gray-500">Loading global users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">No global users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user._id} className="hover:bg-secondary/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{user.username || "N/A"}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-gray-400">{user.global_user_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {user.visas && user.visas.length > 0 ? (
                            user.visas.map((visa) => (
                              <Badge
                                key={visa._id}
                                variant="outline"
                                className={`text-[10px] py-0 ${visa.status === "Suspended" ? "bg-destructive/20 text-destructive border-destructive/20" : "bg-secondary text-primary border-primary/20"}`}
                              >
                                {visa.product_name} ({visa.role})
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">No product access</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "Active" ? "success" : "warning"}
                          className="font-medium"
                        >
                          {user.status === "Active" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {user.status === "Suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGlobalStatusChange(user.global_user_id, "Active")}
                              className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGlobalStatusChange(user.global_user_id, "Suspended")}
                              className="h-8 px-3 bg-destructive/20 text-destructive border-destructive/20 hover:bg-destructive transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
