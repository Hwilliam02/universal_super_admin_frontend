import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Search, Users, XCircle, Key, Building2, ShieldAlert } from "lucide-react";
import { getGlobalUsers, updateGlobalUserStatus, assignUserToCompany, updateUserVisa, adminChangePassword } from "@/api";
import { getAllProducts } from "@/api/productApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { GlobalUser } from "@/types";

export default function UniversalUsersDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isVisaDialogOpen, setIsVisaDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Form States
  const [companyId, setCompanyId] = useState("");
  const [productId, setProductId] = useState("");
  const [visaRole, setVisaRole] = useState("User");
  const [newPassword, setNewPassword] = useState("");

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

  const fetchProductsList = useCallback(async () => {
    try {
      const res = await getAllProducts();
      if ((res.status === "success" || res.status === true) && res.data) {
        setProducts(res.data);
      }
    } catch {
      console.error("Failed to fetch products");
    }
  }, []);

  useEffect(() => {
    fetchGlobalUsers();
    fetchProductsList();
  }, [fetchGlobalUsers, fetchProductsList]);

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

  const handleAssignCompany = async () => {
    if (!selectedUser || !companyId) return;
    try {
      await assignUserToCompany(selectedUser.global_user_id, companyId);
      toast({ title: "Success", description: "Company assigned successfully", variant: "success" });
      setIsCompanyDialogOpen(false);
      setCompanyId("");
      fetchGlobalUsers();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to assign company", variant: "destructive" });
    }
  };

  const handleUpdateVisa = async () => {
    if (!selectedUser || !productId || !visaRole) return;
    try {
      await updateUserVisa(selectedUser.global_user_id, productId, visaRole);
      toast({ title: "Success", description: "Visa/Role updated successfully", variant: "success" });
      setIsVisaDialogOpen(false);
      setProductId("");
      setVisaRole("User");
      fetchGlobalUsers();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to update visa", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      await adminChangePassword(selectedUser.email, newPassword);
      toast({ title: "Success", description: "Password changed successfully", variant: "success" });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to change password", variant: "destructive" });
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

  // When opening the visa dialog, default to the first product if available
  const handleOpenVisaDialog = (user: GlobalUser) => {
    setSelectedUser(user);
    const initialProductId = products.length > 0 ? products[0].product_id : "";
    setProductId(initialProductId);
    
    // Check if user already has a visa for this initial product
    const existingVisa = user.visas?.find((v: any) => v.productId === initialProductId);
    setVisaRole(existingVisa ? existingVisa.role : "User");
    
    setIsVisaDialogOpen(true);
  };

  const handleProductSelectionChange = (newProductId: string) => {
    setProductId(newProductId);
    if (selectedUser) {
      const existingVisa = selectedUser.visas?.find((v: any) => v.productId === newProductId);
      setVisaRole(existingVisa ? existingVisa.role : "User");
    }
  };

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
                  <TableHead className="font-semibold">Global ID / Company</TableHead>
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
                    <TableRow key={user._id || user.global_user_id} className="hover:bg-secondary/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{user.username || "N/A"}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="font-mono text-[10px] text-gray-400">{user.global_user_id}</div>
                         <div className="text-xs text-primary mt-1">{user.global_company_id ? `Company: ${user.global_company_id.substring(0,8)}...` : 'No Company'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {user.visas && user.visas.length > 0 ? (
                            user.visas.map((visa) => (
                              <Badge
                                key={visa._id || visa.productId}
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
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Assign Company"
                            onClick={() => { setSelectedUser(user); setIsCompanyDialogOpen(true); }}
                            className="h-8 w-8 p-0 text-slate-500"
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Update Visa/Role"
                            onClick={() => handleOpenVisaDialog(user)}
                            className="h-8 w-8 p-0 text-slate-500"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Change Password"
                            onClick={() => { setSelectedUser(user); setIsPasswordDialogOpen(true); }}
                            className="h-8 w-8 p-0 text-slate-500"
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          {user.status === "Suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGlobalStatusChange(user.global_user_id, "Active")}
                              className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary transition-colors"
                            >
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGlobalStatusChange(user.global_user_id, "Suspended")}
                              className="h-8 px-3 bg-destructive/20 text-destructive border-destructive/20 hover:bg-destructive transition-colors"
                            >
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

      {/* Assign Company Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Company</DialogTitle>
            <DialogDescription>Assign a company to {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Enter Company ID" 
              value={companyId} 
              onChange={(e) => setCompanyId(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignCompany}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Visa Dialog */}
      <Dialog open={isVisaDialogOpen} onOpenChange={setIsVisaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Product Visa & Role</DialogTitle>
            <DialogDescription>Grant {selectedUser?.email} access to a product or change their role.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Select Product</label>
              <select 
                value={productId} 
                onChange={(e) => handleProductSelectionChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="" disabled>Select a product...</option>
                {products.map((p) => (
                  <option key={p._id || p.product_id} value={p.product_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Assigned Role</label>
              <select 
                value={visaRole} 
                onChange={(e) => setVisaRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVisaDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateVisa}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>Force change password for {selectedUser?.email}. No old password required.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password"
              placeholder="Enter New Password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Save Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
