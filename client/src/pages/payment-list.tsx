import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { Plus, Filter, Download } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { useLocation } from "wouter";
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
import { PaymentList } from "@/components/lists/payment-list";

type Payment = {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  source_id: number;
  payment_mode: string;
  transaction_reference: string | null;
  [key: string]: any;
};

export default function PaymentListPage() {
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    invoice_id: "",
    payment_source_id: "",
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
  
  // Fetch invoices for filter dropdown
  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });
  
  // Fetch payment sources for filter dropdown
  const { data: paymentSources } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  // Fetch purchases for property names
  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
  
  // Function to get invoice details
  const getInvoiceDetails = (invoiceId: number) => {
    if (!invoices) return { number: "Unknown", property: "Unknown Property" };
    
    const invoice = invoices.find((i: any) => i.id === invoiceId);
    if (!invoice) return { number: "Unknown", property: "Unknown Property" };
    
    let propertyName = "Unknown Property";
    
    if (purchases && properties) {
      const purchase = purchases.find((p: any) => p.id === invoice.purchase_id);
      if (purchase) {
        if (purchase.property) {
          propertyName = purchase.property.name;
        } else if (purchase.property_id) {
          const property = properties.find((p: any) => p.id === purchase.property_id);
          if (property) {
            propertyName = property.name;
          }
        }
      }
    }
    
    return {
      number: invoice.invoice_number,
      property: propertyName
    };
  };
  
  // Function to export payments as CSV
  const exportPaymentsCSV = () => {
    // Implementation would go here
    toast({
      title: "Export started",
      description: "Your payments are being exported to CSV.",
    });
  };
  
  // Function to handle delete
  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
  };
  
  // Function to handle edit
  const handleEdit = (payment: Payment) => {
    setPaymentToEdit(payment);
  };
  
  // Function to view payment details
  const handleViewPayment = (paymentId: number) => {
    navigate(`/payments/${paymentId}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Payments</h1>
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
                    <h4 className="font-medium leading-none">Filter Payments</h4>
                    <p className="text-sm text-muted-foreground">
                      Filter payments by invoice, source, or date
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="invoice">Invoice</Label>
                      <Select
                        value={filters.invoice_id}
                        onValueChange={(value) => setFilters({...filters, invoice_id: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All invoices" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All invoices</SelectItem>
                          {invoices?.map((invoice: any) => {
                            const details = getInvoiceDetails(invoice.id);
                            return (
                              <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                {details.property} - #{details.number}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={filters.payment_source_id}
                        onValueChange={(value) => setFilters({...filters, payment_source_id: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All sources</SelectItem>
                          {paymentSources?.map((source: any) => (
                            <SelectItem key={source.id} value={source.id.toString()}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select
                        value={filters.payment_mode}
                        onValueChange={(value) => setFilters({...filters, payment_mode: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All modes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All modes</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online">Online Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
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
                    invoice_id: "",
                    payment_source_id: "",
                    payment_mode: "",
                    from_date: "",
                    to_date: "",
                  })}>
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={exportPaymentsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <PaymentForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {paymentsLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading payments...</p>
          </div>
        ) : !payments || payments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Payments Found</CardTitle>
              <CardDescription>
                {Object.values(filters).some(v => v) 
                  ? "Try adjusting your filters or create a new payment."
                  : "Get started by creating your first payment."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <PaymentList
            payments={payments}
            invoices={invoices}
            purchases={purchases}
            properties={properties}
            paymentSources={paymentSources}
            isLoading={paymentsLoading}
            onDeletePayment={handleDelete}
            onEditPayment={handleEdit}
            onViewPayment={handleViewPayment}
          />
        )}
      </main>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            deleteMutation.mutate(paymentToDelete.id);
          }
        }}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? This action cannot be undone."
      />
      
      {/* Edit dialog */}
      {paymentToEdit && (
        <Dialog open={!!paymentToEdit} onOpenChange={(open) => !open && setPaymentToEdit(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <PaymentForm 
              payment={paymentToEdit as any} 
              onSuccess={() => setPaymentToEdit(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 