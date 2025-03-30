import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceForm, Invoice } from "@/components/forms/invoice-form";
import { Plus, Trash2, Filter, Download, Pencil, FileText } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Link } from "wouter";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// Define types for Purchase and Property
type Purchase = {
  id: number;
  property_id: number;
  [key: string]: any;
};

type Property = {
  id: number;
  name: string;
  [key: string]: any;
};

export default function InvoiceList() {
  const { toast } = useToast();
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState({
    purchase_id: "",
    status: "",
    milestone: "",
    from_date: "",
    to_date: "",
  });
  
  // Fetch invoices with filters
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices", filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await apiRequest("GET", `/api/invoices?${queryParams.toString()}`);
      return res.json();
    },
  });
  
  // Fetch purchases for filter dropdown
  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch properties to get property names
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const getPropertyName = (purchaseId: number): string => {
    if (!Array.isArray(purchases)) return "Unknown Property";
    
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    if (!Array.isArray(properties)) return "Unknown Property";
    
    const property = properties.find(p => p.id === purchase.property_id);
    return property?.name || "Unknown Property";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "partially_paid":
        return <Badge className="bg-yellow-500">Partially Paid</Badge>;
      case "pending":
        return <Badge className="bg-blue-500">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const exportInvoicesCSV = () => {
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) return;
    
    const headers = [
      "Invoice Number",
      "Property",
      "Invoice Date",
      "Due Date",
      "Amount",
      "Paid Amount",
      "Status",
      "Milestone"
    ];
    
    const rows = invoices.map((invoice: any) => [
      invoice.invoice_number,
      getPropertyName(invoice.purchase_id),
      new Date(invoice.invoice_date).toLocaleDateString(),
      invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "",
      invoice.amount,
      invoice.paid_amount,
      invoice.status,
      invoice.milestone || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "invoices.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter Invoices</h4>
                    <p className="text-sm text-muted-foreground">
                      Filter invoices by property, status, or date
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="property">Property</Label>
                      <Select
                        value={filters.purchase_id}
                        onValueChange={(value) => setFilters({...filters, purchase_id: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All properties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All properties</SelectItem>
                          {purchases?.map(purchase => (
                            <SelectItem key={purchase.id} value={purchase.id.toString()}>
                              {getPropertyName(purchase.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({...filters, status: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partially_paid">Partially Paid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="milestone">Milestone</Label>
                      <Input
                        id="milestone"
                        placeholder="Any milestone"
                        className="col-span-2"
                        value={filters.milestone}
                        onChange={(e) => setFilters({...filters, milestone: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="from-date">From Date</Label>
                      <Input
                        id="from-date"
                        type="date"
                        className="col-span-2"
                        value={filters.from_date}
                        onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="to-date">To Date</Label>
                      <Input
                        id="to-date"
                        type="date"
                        className="col-span-2"
                        value={filters.to_date}
                        onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={() => setFilters({
                    purchase_id: "",
                    status: "",
                    milestone: "",
                    from_date: "",
                    to_date: "",
                  })}>
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={exportInvoicesCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <InvoiceForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {invoicesLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading invoices...</p>
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Invoices Found</CardTitle>
              <CardDescription>
                {Object.values(filters).some(v => v) 
                  ? "Try adjusting your filters or create a new invoice."
                  : "Get started by creating your first invoice."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(invoices) && invoices.map((invoice: Invoice) => (
              <Card key={invoice.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg font-medium">
                      Invoice #{invoice.invoice_number}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {getPropertyName(invoice.purchase_id)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(invoice.status)}
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-semibold">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>
                  
                  {invoice.milestone && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Milestone</p>
                      <p className="text-sm">{invoice.milestone}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-muted-foreground">
                      {invoice.paid_amount > 0 && (
                        <span>Paid: {Math.round((invoice.paid_amount / invoice.amount) * 100)}%</span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setInvoiceToEdit(invoice);
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <InvoiceForm invoice={invoice} onSuccess={() => setInvoiceToEdit(null)} />
                          </DialogContent>
                        </Dialog>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onSelect={() => setInvoiceToDelete(invoice)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteMutation.mutate(invoiceToDelete.id);
          }
        }}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
} 