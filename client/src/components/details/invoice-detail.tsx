import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { ArrowLeft, FileText, Pencil, Receipt } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

type InvoiceDetailProps = {
  invoiceId: number;
};

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch invoice details
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
  });
  
  // Fetch related payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", { invoice_id: invoiceId }],
    enabled: !!invoiceId,
  });
  
  // Fetch purchase details
  const { data: purchase } = useQuery({
    queryKey: [`/api/purchases/${invoice?.purchase_id}`],
    enabled: !!invoice?.purchase_id,
  });
  
  // Fetch property details
  const { data: property } = useQuery({
    queryKey: [`/api/properties/${purchase?.property_id}`],
    enabled: !!purchase?.property_id,
  });
  
  // Fetch payment sources for displaying source names
  const { data: paymentSources } = useQuery({
    queryKey: ["/api/payment-sources"],
    enabled: !!payments && payments.length > 0,
  });
  
  const getStatusBadge = (status) => {
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
  
  const getPaymentSourceName = (sourceId) => {
    const source = paymentSources?.find(s => s.id === sourceId);
    return source?.name || "Unknown Source";
  };
  
  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
          <div className="flex justify-center items-center h-64">
            <p>Loading invoice details...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Not Found</CardTitle>
              <CardDescription>
                The invoice you're looking for doesn't exist or has been deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/invoices")}>
                View All Invoices
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <InvoiceForm 
                invoice={invoice} 
                onSuccess={() => setIsEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center">
                    <FileText className="h-6 w-6 mr-2" />
                    Invoice #{invoice.invoice_number}
                  </CardTitle>
                  <CardDescription>
                    {property?.name || "Unknown Property"}
                  </CardDescription>
                </div>
                <div>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                  <p>{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p>{invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                  <p>{formatCurrency(invoice.paid_amount)} 
                    <span className="text-sm text-muted-foreground ml-1">
                      ({Math.round((invoice.paid_amount / invoice.amount) * 100)}%)
                    </span>
                  </p>
                </div>
              </div>
              
              {invoice.milestone && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Milestone</p>
                  <p>{invoice.milestone}</p>
                </div>
              )}
              
              {invoice.description && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{invoice.description}</p>
                </div>
              )}
              
              <Separator className="my-6" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Related Payments</h3>
                  <Link href={`/payments?invoice_id=${invoiceId}`}>
                    <Button variant="outline" size="sm">
                      <Receipt className="h-4 w-4 mr-2" />
                      View All Payments
                    </Button>
                  </Link>
                </div>
                
                {paymentsLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <p>Loading payments...</p>
                  </div>
                ) : !payments || payments.length === 0 ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-center text-muted-foreground">No payments have been made against this invoice yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getPaymentSourceName(payment.source_id)}</TableCell>
                          <TableCell>{payment.payment_mode}</TableCell>
                          <TableCell>{payment.transaction_reference || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 