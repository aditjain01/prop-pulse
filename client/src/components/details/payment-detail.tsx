import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/forms/payment-form";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type PaymentDetailProps = {
  paymentId: number;
};

export function PaymentDetail({ paymentId }: PaymentDetailProps) {
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch payment details
  const { data: payment, isLoading: paymentLoading } = useQuery({
    queryKey: [`/api/payments/${paymentId}`],
  });
  
  // Fetch invoice details
  const { data: invoice } = useQuery({
    queryKey: [`/api/invoices/${payment?.invoice_id}`],
    enabled: !!payment?.invoice_id,
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
  
  // Fetch payment source details
  const { data: paymentSource } = useQuery({
    queryKey: [`/api/payment-sources/${payment?.source_id}`],
    enabled: !!payment?.source_id,
  });
  
  if (paymentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
          </div>
          <div className="flex justify-center items-center h-64">
            <p>Loading payment details...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (!payment) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Not Found</CardTitle>
              <CardDescription>
                The payment you're looking for doesn't exist or has been deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/payments")}>
                View All Payments
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <PaymentForm 
                payment={payment} 
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
                    <Receipt className="h-6 w-6 mr-2" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    {property?.name || "Unknown Property"}
                  </CardDescription>
                </div>
                <div>
                  <Badge variant="outline">{payment.payment_mode}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p>{formatDate(payment.payment_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Source</p>
                  <p>{paymentSource?.name || "Unknown Source"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Mode</p>
                  <p>{payment.payment_mode}</p>
                </div>
              </div>
              
              {payment.transaction_reference && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Transaction Reference</p>
                  <p>{payment.transaction_reference}</p>
                </div>
              )}
              
              {payment.notes && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p>{payment.notes}</p>
                </div>
              )}
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Related Invoice</h3>
                
                {!invoice ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-center text-muted-foreground">No invoice information available.</p>
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/invoices/${invoice.id}`} className="text-blue-500 hover:underline flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Invoice #{invoice.invoice_number}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(invoice.invoice_date)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-muted-foreground text-right">
                          {invoice.status === "paid" ? "Paid" : 
                           invoice.status === "partially_paid" ? "Partially Paid" : 
                           invoice.status === "pending" ? "Pending" : invoice.status}
                        </p>
                      </div>
                    </div>
                    
                    {invoice.description && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm">
                          View Invoice Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 