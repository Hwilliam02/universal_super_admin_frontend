import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLeadStore } from "@/store/leadStore";
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
import CreateLeadDialog from "@/pages/CreateLeadDialog";
import LeadDetailsDialog from "@/pages/LeadDetailsDialog";
import {
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Trash2,
  Phone,
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
import type { Lead } from "@/types";

export default function LeadDashboard() {
  const { toast } = useToast();
  const { leads, fetchLeads, updateLeadStatus, deleteLead } = useLeadStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "delete";
    id: string;
    value?: string;
    name?: string;
  } | null>(null);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Filter leads by search and status
  const { newLeads, contactedLeads, convertedLeads, rejectedLeads } = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const searchedLeads = leads.filter((lead) => {
      const companyName = lead.company_name?.toLowerCase() || "";
      const contactPerson = lead.contact_person?.toLowerCase() || "";
      const email = lead.email?.toLowerCase() || "";
      const serviceArea = lead.service_area?.toLowerCase() || "";
      const companyType = lead.company_type?.toLowerCase() || "";
      const yourRole = lead.your_role?.toLowerCase() || "";
      const deliveryModel = lead.delivery_model?.toLowerCase() || "";

      return (
        companyName.includes(q) ||
        contactPerson.includes(q) ||
        email.includes(q) ||
        serviceArea.includes(q) ||
        companyType.includes(q) ||
        yourRole.includes(q) ||
        deliveryModel.includes(q)
      );
    });

    return {
      newLeads: searchedLeads.filter((l) => l.status === "new"),
      contactedLeads: searchedLeads.filter((l) => l.status === "contacted"),
      convertedLeads: searchedLeads.filter((l) => l.status === "converted"),
      rejectedLeads: searchedLeads.filter((l) => l.status === "rejected"),
    };
  }, [leads, searchQuery]);

  const getStatusVariant = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return "info";
      case "contacted":
        return "secondary";
      case "converted":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case "contacted":
        return <Phone className="h-3 w-3 mr-1" />;
      case "converted":
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case "rejected":
        return <XCircle className="h-3 w-3 mr-1" />;
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

  const handleStatusChange = (id: string, status: string, name: string) => {
    setPendingAction({ type: "status", id, value: status, name });
  };

  const confirmStatusChange = async () => {
    if (pendingAction && pendingAction.type === "status") {
      const success = await updateLeadStatus(pendingAction.id, pendingAction.value!);
      if (success) {
        toast({
          title: "Status updated",
          description: `Lead status changed to ${pendingAction.value}.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update lead status.",
          variant: "destructive",
        });
      }
      setPendingAction(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setPendingAction({ type: "delete", id, name });
  };

  const confirmDelete = async () => {
    if (pendingAction && pendingAction.type === "delete") {
      const success = await deleteLead(pendingAction.id);
      if (success) {
        toast({
          title: "Lead deleted",
          description: `${pendingAction.name} has been deleted.`,
          variant: "destructive",
        });
      }
      setPendingAction(null);
    }
  };

  // Renders a lead table for any given list
  const renderLeadTable = (leadsList: Lead[], emptyMessage: string) => (
    <>
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold w-[72px] text-center">Logo</TableHead>
            <TableHead className="font-semibold">Company Name</TableHead>
            <TableHead className="font-semibold">Full Name</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="text-center font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="text-center font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? "No leads found matching your search" : emptyMessage}
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
            leadsList.map((lead) => (
              <TableRow
                key={lead._id}
                className="hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedLeadForDetails(lead);
                  setIsDetailsOpen(true);
                }}
              >
                <TableCell className="text-center">
                  {lead.logo_url ? (
                    <img
                      src={lead.logo_url}
                      alt={`${lead.company_name} logo`}
                      className="h-10 w-10 object-contain rounded-lg border border-gray-200 bg-white mx-auto"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 mx-auto">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {lead.company_name || "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {lead.contact_person || "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {lead.email}
                </TableCell>
                <TableCell className="text-gray-600 font-medium text-center">
                  {lead.delivery_type === "job"
                    ? "Job Board"
                    : lead.delivery_type === "willcall"
                      ? "Will Call"
                      : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusVariant(lead.status)}
                    className="font-medium capitalize px-2.5 py-0.5"
                  >
                    {getStatusIcon(lead.status)}
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {formatDate(lead.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {lead.status !== "contacted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "contacted", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                        title="Mark as Contacted"
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Contacted
                      </Button>
                    )}
                    {lead.status !== "converted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "converted", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-secondary text-primary border-primary/20 hover:bg-secondary hover:text-primary transition-colors"
                        title="Mark as Converted"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Converted
                      </Button>
                    )}
                    {lead.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "rejected", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-accent/20 text-accent-foreground border-accent/20 hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Mark as Rejected"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Rejected
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead._id, lead.company_name || "Unknown");
                      }}
                      className="h-8 px-3 bg-destructive/20 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    
    <LeadDetailsDialog 
      lead={selectedLeadForDetails} 
      open={isDetailsOpen} 
      onOpenChange={setIsDetailsOpen} 
    />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Lead Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and track your leads.
          </p>
        </div>
      </div>

      {/* Stats Cards - Redesigned for Data Density */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                New Leads
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {leads.filter((l) => l.status === "new").length}
              </h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Contacted
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {leads.filter((l) => l.status === "contacted").length}
              </h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-md">
              <Phone className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Converted
              </p>
              <h3 className="text-2xl font-bold text-primary">
                {leads.filter((l) => l.status === "converted").length}
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
                Rejected
              </p>
              <h3 className="text-2xl font-bold text-accent">
                {leads.filter((l) => l.status === "rejected").length}
              </h3>
            </div>
            <div className="bg-accent/10 p-2 rounded-md">
              <XCircle className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  Leads Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage all leads and their statuses • {leads.length} total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CreateLeadDialog />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mt-2 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search leads by company, contact, email or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 border-gray-200 focus:border-primary/20 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full sm:w-[500px] grid-cols-4 h-10 mb-4">
                <TabsTrigger value="new" className="text-sm font-medium">
                  New ({newLeads.length})
                </TabsTrigger>
                <TabsTrigger value="contacted" className="text-sm font-medium">
                  Contacted ({contactedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="converted" className="text-sm font-medium">
                  Converted ({convertedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-sm font-medium">
                  Rejected ({rejectedLeads.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-0">
                {renderLeadTable(newLeads, "No new leads yet. Create your first lead!")}
              </TabsContent>

              <TabsContent value="contacted" className="mt-0">
                {renderLeadTable(contactedLeads, "No contacted leads")}
              </TabsContent>

              <TabsContent value="converted" className="mt-0">
                {renderLeadTable(convertedLeads, "No converted leads yet")}
              </TabsContent>

              <TabsContent value="rejected" className="mt-0">
                {renderLeadTable(rejectedLeads, "No rejected leads")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? "Delete Lead"
                : "Change Status"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `Are you sure you want to delete the lead "${pendingAction.name}"? This action cannot be undone.`
                : `Are you sure you want to change the lead status to "${pendingAction?.value}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                pendingAction?.type === "delete"
                  ? confirmDelete
                  : confirmStatusChange
              }
              className={
                pendingAction?.type === "delete"
                  ? "bg-destructive hover:bg-destructive"
                  : pendingAction?.value === "converted"
                    ? "bg-primary hover:bg-primary"
                    : pendingAction?.value === "contacted"
                      ? "bg-primary hover:bg-primary"
                      : pendingAction?.value === "rejected"
                        ? "bg-accent hover:bg-accent"
                        : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
