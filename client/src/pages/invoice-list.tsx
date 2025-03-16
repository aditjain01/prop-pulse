import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { Plus, Filter, Download } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceList } from "@/components/lists/invoice-list";

// Define types for Purchase and Invoice
type Purchase = {
  id: number;
  property_id: number;
  property_name: string;
  [key: string]: any;
};

type Invoice = {
  id: number;
  invoice_number: string;
  purchase_id: number;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  milestone: string | null;
  property_name: string;
  [key: string]: any;
};

export default function InvoiceListPage() {
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
    queryKey: ["/api/v2/invoices", filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await apiRequest("GET", `/api/v2/invoices?${queryParams.toString()}`);
      return res.json();
    },
  });
  
  // Fetch purchases for filter dropdown
  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ["/api/v2/purchases"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/invoices"] });
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
  
  // Function to export invoices as CSV
  const exportInvoicesCSV = () => {
    // Implementation would go here
    toast({
      title: "Export started",
      description: "Your invoices are being exported to CSV.",
    });
  };
  
  // Function to handle delete
  const handleDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };
  
  // Function to handle edit
  const handleEdit = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
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
                              {purchase.property_name || `Purchase #${purchase.id}`}
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
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="milestone">Milestone</Label>
                      <Input
                        id="milestone"
                        placeholder="e.g. Foundation"
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
          <InvoiceList
            invoices={invoices}
            isLoading={invoicesLoading}
            onDeleteInvoice={handleDelete}
            onEditInvoice={handleEdit}
          />
        )}
      </main>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => deleteMutation.mutate(invoiceToDelete!.id)}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoiceToDelete?.invoice_number}? This action cannot be undone.`}
      />
      
      {/* Edit dialog */}
      {invoiceToEdit && (
        <Dialog open={!!invoiceToEdit} onOpenChange={(open) => !open && setInvoiceToEdit(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <InvoiceForm 
              invoice={invoiceToEdit}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/v2/invoices"] });
                setInvoiceToEdit(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 