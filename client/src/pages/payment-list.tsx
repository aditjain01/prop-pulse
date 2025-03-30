import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { Plus, Trash2, Filter, Download, Pencil, FileText } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Link, useLocation } from "wouter";
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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentList() {
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [paymentToEdit, setPaymentToEdit] = useState(null);
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
  
  // Helper function to get invoice details
  const getInvoiceDetails = (invoiceId: number) => {
    const invoice = invoices?.find(i => i.id === invoiceId);
    if (!invoice) return { number: "Unknown", property: "Unknown" };
    
    const purchase = purchases?.find(p => p.id === invoice.purchase_id);
    if (!purchase) return { number: invoice.invoice_number, property: "Unknown" };
    
    const property = properties?.find(p => p.id === purchase.property_id);
    return { 
      number: invoice.invoice_number, 
      property: property?.name || "Unknown Property" 
    };
  };
  
  // Helper function to get payment source name
  const getPaymentSourceName = (sourceId: number) => {
    const source = paymentSources?.find(s => s.id === sourceId);
    return source?.name || "Unknown Source";
  };
  
  const exportPaymentsCSV = () => {
    if (!payments || payments.length === 0) return;
    
    const headers = [
      "Date",
      "Invoice",
      "Property",
      "Amount",
      "Payment Mode",
      "Source",
      "Reference"
    ];
    
    const rows = payments.map(payment => {
      const invoiceDetails = getInvoiceDetails(payment.invoice_id);
      return [
        formatDate(payment.payment_date),
        invoiceDetails.number,
        invoiceDetails.property,
        payment.amount,
        payment.payment_mode,
        getPaymentSourceName(payment.source_id),
        payment.transaction_reference || ""
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "payments.csv");
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
                          {invoices?.map(invoice => {
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
                          {paymentSources?.map(source => (
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
                  New Payment
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => {
                  const invoiceDetails = getInvoiceDetails(payment.invoice_id);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>
                        <Link href={`/invoices/${payment.invoice_id}`} className="text-blue-500 hover:underline flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          #{invoiceDetails.number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoiceDetails.property}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_mode}</Badge>
                      </TableCell>
                      <TableCell>{getPaymentSourceName(payment.source_id)}</TableCell>
                      <TableCell>{payment.transaction_reference || "-"}</TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem 
                              onSelect={() => navigate(`/payments/${payment.id}`)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => {
                                  e.preventDefault();
                                  setPaymentToEdit(payment);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <PaymentForm payment={paymentToEdit} onSuccess={() => setPaymentToEdit(null)} />
                              </DialogContent>
                            </Dialog>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onSelect={() => setPaymentToDelete(payment)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
} 