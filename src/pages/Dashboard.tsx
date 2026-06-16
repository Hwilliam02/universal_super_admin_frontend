import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompanyStore } from "@/store/companyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProductVerificationMethod, getAllProducts } from "@/api/productApi";
import type { Product } from "@/types";
import CompanyUsersDialog from "@/components/CompanyUsersDialog";
import CreateCompanyDialog from "./CreateCompanyDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  Hash,
  Settings,
  Link2,
  Shield,
  XCircle,
  Calendar,
  Mail,
  RotateCcw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Company, GlobalUser } from "@/types";
import { resendCompanyRegistration, getGlobalUsers, updateGlobalUserStatus } from "@/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    companies,
    updateCompanyStatus,
    softDeleteCompany,
    undeleteCompany,
    fetchCompanies,
  } = useCompanyStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "delete" | "undelete";
    id: string;
    value?: string;
    name?: string;
  } | null>(null);
  const [companyUsersDialog, setCompanyUsersDialog] = useState<{
    open: boolean;
    companyId: string;
    companyName: string;
  }>({
    open: false,
    companyId: "",
    companyName: "",
  });

  const [globalUsers, setGlobalUsers] = useState<GlobalUser[]>([]);
  const [globalUsersLoading, setGlobalUsersLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
    fetchProducts();
    fetchGlobalUsers();
  }, [fetchCompanies]);

  const fetchGlobalUsers = async () => {
    try {
      setGlobalUsersLoading(true);
      const res = await getGlobalUsers();
      if ((res.status === "success" || res.status === true) && res.data) {
        setGlobalUsers(res.data);
      }
    } catch (error) {
      console.error("Error fetching global users:", error);
    } finally {
      setGlobalUsersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts();
      if ((res.status === "success" || res.status === true) && res.data) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleCompanyClick = (companyId: string, companyName: string) => {
    navigate(`/companies/${companyId}/analytics`, { state: { companyName } });
  };


  const { mainCompanies, suspendedCompanies } = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const searchedCompanies = companies.filter((company) => {
      const name = company.name?.toLowerCase() || "";
      const domain = company.domain?.toLowerCase() || "";
      const adminFirst = company.admin?.first_name?.toLowerCase() || "";
      const adminLast = company.admin?.last_name?.toLowerCase() || "";
      const adminEmail = company.admin?.email?.toLowerCase() || "";
      
      const matchesSearch = name.includes(q) ||
        domain.includes(q) ||
        adminFirst.includes(q) ||
        adminLast.includes(q) ||
        adminEmail.includes(q);

      // 2: Product Filter
      const companyProductIds = company.productIds || [];
      const matchesProduct = selectedProductId === "all" || companyProductIds.some((id: string) => String(id) === String(selectedProductId));

      return matchesSearch && matchesProduct;
    });

    return {
      mainCompanies: searchedCompanies.filter(
        (company) => company.status !== "suspended",
      ),
      suspendedCompanies: searchedCompanies.filter(
        (company) => company.status === "suspended",
      ),
    };
  }, [companies, searchQuery, selectedProductId]);

  const getStatusVariant = (status: Company["status"]) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "suspended":
        return "warning";
      default:
        return "default";
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

  const isRegistrationExpired = (company: Company) => {
    // If company status is suspended and has admin, allow resending verification code
    return company.status === "suspended" && company.admin !== null;
  };

  const handleResendRegistration = async (
    adminId: string,
    companyName: string,
  ) => {
    try {
      await resendCompanyRegistration(adminId);
      await fetchCompanies();
      toast({
        title: "Verification Sent",
        description: `Verification code has been resent to ${companyName}.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (id: string, status: Company["status"]) => {
    setPendingAction({ type: "status", id, value: status });
  };

  const confirmStatusChange = () => {
    if (pendingAction && pendingAction.type === "status") {
      updateCompanyStatus(
        pendingAction.id,
        pendingAction.value as Company["status"],
      );
      toast({
        title: "Status updated",
        description: `Company status changed to ${pendingAction.value}.`,
        variant: "success",
      });
      setPendingAction(null);
    }
  };

  const handleUndelete = (id: string, name: string) => {
    setPendingAction({ type: "undelete", id, name });
  };

  const confirmDelete = async () => {
    if (pendingAction && pendingAction.type === "delete") {
      const success = await softDeleteCompany(pendingAction.id);
      if (success) {
        toast({
          title: "Company deleted",
          description: `${pendingAction.name} has been soft deleted.`,
          variant: "destructive",
        });
      }
      setPendingAction(null);
    }
  };

  const confirmUndelete = async () => {
    if (pendingAction && pendingAction.type === "undelete") {
      const success = await undeleteCompany(pendingAction.id);
      if (success) {
        toast({
          title: "Company restored",
          description: `${pendingAction.name} has been restored.`,
          variant: "success",
        });
      }
      setPendingAction(null);
    }
  };

  const handleGlobalStatusChange = async (userId: string, status: 'Active' | 'Suspended') => {
    try {
      const res = await updateGlobalUserStatus(userId, status);
      if (res.status === "success" || res.status === true) {
        toast({
          title: "Status Updated",
          description: `User status changed to ${status}.`,
          variant: "success",
        });
        fetchGlobalUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleVerificationMethodChange = async (
    productId: string,
    method: 'code' | 'link' | 'none'
  ) => {
    try {
      const res = await updateProductVerificationMethod(productId, method);
      if (res.status === "success" || res.status === true) {
        // Update local state
        setProducts((prev: Product[]) =>
          prev.map((p: Product) =>
            p._id === productId ? { ...p, verification_method: method } : p
          )
        );
        toast({
          title: "Verification Updated",
          description: `Verification method set to '${method}'.`,
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification method.",
        variant: "destructive",
      });
    }
  };

  const filteredGlobalUsers = useMemo(() => {
    const q_ = (userSearchQuery || "").trim().toLowerCase();
    return globalUsers.filter((user) => {
      const email = user.email?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";
      const id = user.global_user_id?.toLowerCase() || "";
      return (
        email.includes(q_) ||
        username.includes(q_) ||
        id.includes(q_)
      );
    });
  }, [globalUsers, userSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Companies Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your companies, global users, and product integrations.
          </p>
        </div>
      </div>

      {/* Stats Cards - Redesigned for Data Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Active Companies
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {companies.filter((c) => c.status === "active").length}
              </h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Suspended Companies
              </p>
              <h3 className="text-2xl font-bold text-accent">
                {companies.filter((c) => c.status === "suspended").length}
              </h3>
            </div>
            <div className="bg-accent/10 p-2 rounded-md">
              <AlertCircle className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Global Users
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {globalUsers.length}
              </h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Registered Products
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {products.length}
              </h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full sm:w-[480px] grid-cols-2 mb-8 bg-white/50 backdrop-blur-sm p-1 rounded-xl border-2 border-white/60 shadow-lg h-12">
            <TabsTrigger value="companies" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies Management
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Global Users Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card className="shadow-xl border-0">

          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  Companies Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage all companies and their statuses • {companies.length}{" "}
                  total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CreateCompanyDialog />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter and Search */}
            <div className="mt-4 mb-6 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-[240px]">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="h-11 border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>All Products</span>
                      </div>
                    </SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>{product.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search companies, domains, or admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-11 border-gray-200 focus:border-primary/20 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Product Verification Settings */}
            {products.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-primary">User Verification Settings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-800 truncate">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            handleVerificationMethodChange(product._id, 'code')
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            (product.verification_method || 'code') === 'code'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Hash className="h-3 w-3" />
                          Code
                        </button>
                        <button
                          onClick={() =>
                            handleVerificationMethodChange(product._id, 'link')
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            product.verification_method === 'link'
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Link2 className="h-3 w-3" />
                          Link
                        </button>
                        <button
                          onClick={() =>
                            handleVerificationMethodChange(product._id, 'none')
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                            product.verification_method === 'none'
                              ? 'bg-gray-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          None
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full sm:w-[360px] grid-cols-2 h-10 mb-4">
                <TabsTrigger value="main" className="text-sm font-medium">
                  Active ({mainCompanies.length})
                </TabsTrigger>
                <TabsTrigger value="suspended" className="text-sm font-medium">
                  Suspended ({suspendedCompanies.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="mt-0">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold w-[72px] text-center">
                          Logo
                        </TableHead>
                        <TableHead className="font-semibold">
                          Company Name
                        </TableHead>
                        <TableHead className="font-semibold">
                          Admin Name
                        </TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Products</TableHead>
                        <TableHead className="font-semibold text-center">Users</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="text-center font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mainCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <Building2 className="h-12 w-12 text-gray-300" />
                              <p className="text-gray-500 font-medium">
                                {searchQuery
                                  ? "No companies found in main list"
                                  : "No companies yet. Create your first company!"}
                              </p>
                              {searchQuery && (
                                <p className="text-sm text-gray-400">
                                  Try adjusting your search criteria
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        mainCompanies.map((company) => (
                          <TableRow
                            key={company._id}
                            className={`hover:bg-secondary/50 transition-colors ${company.status === "deleted" ? "opacity-50 bg-gray-100" : ""}`}
                          >
                            <TableCell className="text-center">
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt={`${company.name} logo`}
                                  className="h-10 w-10 object-contain rounded-lg border border-gray-200 bg-white mx-auto"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 mx-auto">
                                  N/A
                                </div>
                              )}
                            </TableCell>
                            <TableCell
                              className="font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors"
                              onClick={() =>
                                handleCompanyClick(company._id, company.name)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span>{company.name}</span>
                                {company.is_trial && (
                                  <Badge className="bg-secondary text-primary hover:bg-secondary border border-primary/20 text-[10px] uppercase font-bold py-0 h-5">
                                    Free Trial
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {company.admin
                                ? `${company.admin.first_name} ${company.admin.last_name}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {company.admin?.email ||
                                company.displayEmail ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(company.productIds && company.productIds.length > 0) ? (
                                  company.productIds.map(pid => {
                                    const productName = products.find(p => p.product_id === pid)?.name || pid;
                                    return (
                                      <Badge key={pid} variant="outline" className="bg-secondary text-primary border-primary/20 text-[10px] py-0">
                                        {productName}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-400 text-xs italic">No Products</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {company.userCount || 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(company.status)}
                                className="font-medium"
                              >
                                {company.status === "active" && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {company.status === "inactive" && (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {company.status === "suspended" && (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {company.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {formatDate(company.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                {company.admin &&
                                  isRegistrationExpired(company) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleResendRegistration(
                                          (company.admin as { _id: string })
                                            ._id,
                                          company.name,
                                        )
                                      }
                                      className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                      title="Send Verification Code"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                      Send Code
                                    </Button>
                                  )}
                                {company.status === "deleted" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUndelete(company._id, company.name)
                                    }
                                    className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                    title="Restore Company"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                    Restore
                                  </Button>
                                ) : (
                                  <>
                                    {company.status !== "active" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleStatusChange(
                                            company._id,
                                            "active",
                                          )
                                        }
                                        className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                        title="Set as Active"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        Active
                                      </Button>
                                    )}
                                    {company.status !== "suspended" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleStatusChange(
                                            company._id,
                                            "suspended",
                                          )
                                        }
                                        className="h-8 px-3 bg-accent/20 text-accent-foreground border-accent/20 hover:bg-accent hover:text-accent-foreground transition-colors"
                                        title="Suspend"
                                      >
                                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                        Suspend
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="suspended" className="mt-0">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold w-[72px] text-center">
                          Logo
                        </TableHead>
                        <TableHead className="font-semibold">
                          Company Name
                        </TableHead>
                        <TableHead className="font-semibold">
                          Admin Name
                        </TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Products</TableHead>
                        <TableHead className="font-semibold text-center">Users</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="text-center font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suspendedCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <Building2 className="h-12 w-12 text-gray-300" />
                              <p className="text-gray-500 font-medium">
                                {searchQuery
                                  ? "No suspended companies found"
                                  : "No suspended companies"}
                              </p>
                              {searchQuery && (
                                <p className="text-sm text-gray-400">
                                  Try adjusting your search criteria
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        suspendedCompanies.map((company) => (
                          <TableRow
                            key={company._id}
                            className={`hover:bg-secondary/50 transition-colors ${company.status === "deleted" ? "opacity-50 bg-gray-100" : ""}`}
                          >
                            <TableCell className="text-center">
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt={`${company.name} logo`}
                                  className="h-10 w-10 object-contain rounded-lg border border-gray-200 bg-white mx-auto"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 mx-auto">
                                  N/A
                                </div>
                              )}
                            </TableCell>
                            <TableCell
                              className="font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors"
                              onClick={() =>
                                handleCompanyClick(company._id, company.name)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span>{company.name}</span>
                                {company.is_trial && (
                                  <Badge className="bg-secondary text-primary hover:bg-secondary border border-primary/20 text-[10px] uppercase font-bold py-0 h-5">
                                    Free Trial
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {company.admin
                                ? `${company.admin.first_name} ${company.admin.last_name}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {company.admin?.email ||
                                company.displayEmail ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(company.productIds && company.productIds.length > 0) ? (
                                  company.productIds.map(pid => {
                                    const productName = products.find(p => p.product_id === pid)?.name || pid;
                                    return (
                                      <Badge key={pid} variant="outline" className="bg-secondary text-primary border-primary/20 text-[10px] py-0">
                                        {productName}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-400 text-xs italic">No Products</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {company.userCount || 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(company.status)}
                                className="font-medium"
                              >
                                {company.status === "active" && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {company.status === "inactive" && (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {company.status === "suspended" && (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {company.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {formatDate(company.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                {company.admin &&
                                  isRegistrationExpired(company) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleResendRegistration(
                                          (company.admin as { _id: string })
                                            ._id,
                                          company.name,
                                        )
                                      }
                                      className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                      title="Send Verification Code"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                      Send Code
                                    </Button>
                                  )}
                                {company.status === "deleted" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUndelete(company._id, company.name)
                                    }
                                    className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                    title="Restore Company"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                    Restore
                                  </Button>
                                ) : (
                                  <>
                                    {company.status !== "active" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleStatusChange(
                                            company._id,
                                            "active",
                                          )
                                        }
                                        className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                                        title="Set as Active"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        Active
                                      </Button>
                                    )}
                                    {company.status !== "suspended" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleStatusChange(
                                            company._id,
                                            "suspended",
                                          )
                                        }
                                        className="h-8 px-3 bg-accent/20 text-accent-foreground border-accent/20 hover:bg-accent hover:text-accent-foreground transition-colors"
                                        title="Suspend"
                                      >
                                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                        Suspend
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Global Users Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage users who are not associated with any specific company • {globalUsers.length} total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search users by email, username, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
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
                  {globalUsersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <RotateCcw className="h-8 w-8 text-primary animate-spin" />
                          <p className="text-gray-500">Loading global users...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredGlobalUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">No global users found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGlobalUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{user.username || 'N/A'}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-gray-400">
                          {user.global_user_id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {user.visas && user.visas.length > 0 ? (
                              user.visas.map((visa) => (
                                <Badge 
                                  key={visa._id} 
                                  variant="outline" 
                                  className={`text-[10px] py-0 ${visa.status === 'Suspended' ? 'bg-destructive/20 text-destructive border-destructive/20' : 'bg-secondary text-primary border-primary/20'}`}
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
                            variant={user.status === 'Active' ? 'success' : 'warning'}
                            className="font-medium"
                          >
                            {user.status === 'Active' ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {user.status === 'Suspended' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGlobalStatusChange(user.global_user_id, 'Active')}
                                className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Activate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGlobalStatusChange(user.global_user_id, 'Suspended')}
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
      </TabsContent>
    </Tabs>
      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? "Delete Company"
                : pendingAction?.type === "undelete"
                  ? "Restore Company"
                  : "Change Status"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `Are you sure you want to soft delete "${pendingAction.name}"? The company will be hidden but can be restored later.`
                : pendingAction?.type === "undelete"
                  ? `Are you sure you want to restore "${pendingAction.name}"? The company will be set to inactive status.`
                  : `Are you sure you want to change the company status to "${pendingAction?.value}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                pendingAction?.type === "delete"
                  ? confirmDelete
                  : pendingAction?.type === "undelete"
                    ? confirmUndelete
                    : confirmStatusChange
              }
              className={
                pendingAction?.type === "delete"
                  ? "bg-destructive hover:bg-destructive"
                  : pendingAction?.type === "undelete"
                    ? "bg-primary hover:bg-primary"
                    : pendingAction?.value === "active"
                      ? "bg-primary hover:bg-primary"
                      : pendingAction?.value === "inactive"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : pendingAction?.value === "suspended"
                          ? "bg-accent hover:bg-accent"
                          : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company Users Dialog */}
      <CompanyUsersDialog
        open={companyUsersDialog.open}
        onOpenChange={(open) =>
          setCompanyUsersDialog((prev) => ({ ...prev, open }))
        }
        companyId={companyUsersDialog.companyId}
        companyName={companyUsersDialog.companyName}
      />
    </div>
  );
}
