import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/payment-form";
import { Plus, Trash2, Filter, Download, Pencil } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
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
import { SlideDialog } from "@/components/slide-dialog";

export default function PaymentList() {
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [filters, setFilters] = useState({
    purchase_id: "",
    payment_source_id: "",
    milestone: "",
    payment_mode: "",
    from_date: "",
    to_date: "",
  });
  
  // Fetch payments with filters
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await apiRequest("GET", `/api/payments?${queryParams.toString()}`);
      return res.json();
    },
  });
  
  // Fetch purchases for filter dropdown
  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch payment sources for filter dropdown
  const { data: paymentSources } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  // Fetch properties to get property names
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Payment deleted",
        description: "The payment has been deleted successfully.",
      });
      setPaymentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to get property name for a purchase
  const getPropertyName = (purchaseId) => {
    if (!purchaseId) return "Unknown Property";
    
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    // If purchase has property object directly
    if (purchase.property && purchase.property.name) {
      return purchase.property.name;
    }
    
    // If purchase only has property_id
    if (purchase.property_id) {
      const property = properties?.find(p => p.id === purchase.property_id);
      return property ? property.name : "Unknown Property";
    }
    
    return "Unknown Property";
  };
  
  // Function to get payment source name
  const getPaymentSourceName = (sourceId) => {
    if (!sourceId) return "Unknown Source";
    
    const source = paymentSources?.find(s => s.id === sourceId);
    return source ? source.name : "Unknown Source";
  };
  
  // Function to export payments as CSV
  const exportPaymentsCSV = () => {
    if (!payments || payments.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no payments matching your filters.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV header
    const headers = [
      "ID", "Property", "Date", "Amount", "Source", "Mode", 
      "Milestone", "Reference", "Invoice Date", "Invoice Number", 
      "Invoice Amount", "Receipt Date", "Receipt Number", "Receipt Amount"
    ];
    
    // Create CSV rows
    const rows = payments.map(payment => [
      payment.id,
      getPropertyName(payment.purchase_id),
      new Date(payment.payment_date).toLocaleDateString(),
      payment.amount,
      getPaymentSourceName(payment.payment_source_id),
      payment.payment_mode,
      payment.milestone || "",
      payment.transaction_reference || "",
      payment.invoice_date ? new Date(payment.invoice_date).toLocaleDateString() : "",
      payment.invoice_number || "",
      payment.invoice_amount || "",
      payment.receipt_date ? new Date(payment.receipt_date).toLocaleDateString() : "",
      payment.receipt_number || "",
      payment.receipt_amount || ""
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate total amount
  const totalAmount = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">
              {payments?.length || 0} payments, total: ₹{totalAmount.toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Payments</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="property">Property</Label>
                    <Select 
                      onValueChange={(value) => setFilters({...filters, purchase_id: value})}
                      value={filters.purchase_id}
                    >
                      <SelectTrigger id="property">
                        <SelectValue placeholder="All properties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All properties</SelectItem>
                        {purchases?.map((purchase) => (
                          <SelectItem key={purchase.id} value={purchase.id.toString()}>
                            {getPropertyName(purchase.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="source">Payment Source</Label>
                    <Select 
                      onValueChange={(value) => setFilters({...filters, payment_source_id: value})}
                      value={filters.payment_source_id}
                    >
                      <SelectTrigger id="source">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All sources</SelectItem>
                        {paymentSources?.map((source) => (
                          <SelectItem key={source.id} value={source.id.toString()}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="milestone">Milestone</Label>
                    <Select 
                      onValueChange={(value) => setFilters({...filters, milestone: value})}
                      value={filters.milestone}
                    >
                      <SelectTrigger id="milestone">
                        <SelectValue placeholder="All milestones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All milestones</SelectItem>
                        <SelectItem value="Booking">Booking</SelectItem>
                        <SelectItem value="Down Payment">Down Payment</SelectItem>
                        <SelectItem value="EMI">EMI</SelectItem>
                        <SelectItem value="Registration">Registration</SelectItem>
                        <SelectItem value="Possession">Possession</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mode">Payment Mode</Label>
                    <Select 
                      onValueChange={(value) => setFilters({...filters, payment_mode: value})}
                      value={filters.payment_mode}
                    >
                      <SelectTrigger id="mode">
                        <SelectValue placeholder="All modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All modes</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="from_date">From Date</Label>
                      <Input 
                        id="from_date" 
                        type="date" 
                        value={filters.from_date}
                        onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to_date">To Date</Label>
                      <Input 
                        id="to_date" 
                        type="date" 
                        value={filters.to_date}
                        onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({
                        purchase_id: "",
                        payment_source_id: "",
                        milestone: "",
                        payment_mode: "",
                        from_date: "",
                        to_date: "",
                      })}
                    >
                      Reset
                    </Button>
                    <Button onClick={() => document.body.click()}>Apply Filters</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={exportPaymentsCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            
            <SlideDialog
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment
                </Button>
              }
              title="Add Payment"
            >
              <PaymentForm 
                purchaseId={parseInt(filters.purchase_id) || undefined} 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/payments"] })}
              />
            </SlideDialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : payments?.length ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getPropertyName(payment.purchase_id)}</TableCell>
                      <TableCell>₹{Number(payment.amount).toLocaleString()}</TableCell>
                      <TableCell>{getPaymentSourceName(payment.payment_source_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_mode.charAt(0).toUpperCase() + payment.payment_mode.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.milestone || "-"}</TableCell>
                      <TableCell>{payment.transaction_reference || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <SlideDialog
                            trigger={
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                            title="Edit Payment"
                          >
                            <PaymentForm 
                              payment={payment} 
                              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/payments"] })}
                            />
                          </SlideDialog>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setPaymentToDelete(payment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <p className="text-muted-foreground">No payments found.</p>
                      {Object.values(filters).some(Boolean) && (
                        <p className="text-sm mt-2">Try adjusting your filters or create a new payment.</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <DeleteConfirmation
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => deleteMutation.mutate(paymentToDelete.id)}
        title="Delete Payment"
        description={`Are you sure you want to delete this payment of ₹${paymentToDelete ? Number(paymentToDelete.amount).toLocaleString() : 0}? This action cannot be undone.`}
      />
    </div>
  );
} 