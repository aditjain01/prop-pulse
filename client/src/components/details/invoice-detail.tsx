import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FileText, Pencil, Receipt, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { PaymentList } from "@/components/lists/payment-list";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { type Invoice, type Payment, type PaymentSource } from "@/lib/schemas";

// Define types for the component
interface Property {
  id: number;
  name: string;
  [key: string]: any;
}

interface Purchase {
  id: number;
  property_id: number;
  [key: string]: any;
}

type InvoiceDetailProps = {
  invoiceId: number;
};

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch invoice details
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: [`/api/v2/invoices/${invoiceId}`],
  });
  
  // Fetch related payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/v2/payments", { invoice_id: invoiceId }],
    enabled: !!invoiceId,
  });
  
  // Fetch payment sources for displaying source names
  const { data: paymentSources = [] } = useQuery<PaymentSource[]>({
    queryKey: ["/api/v2/payment-sources"],
    enabled: !!payments && payments.length > 0,
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/v2/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/invoices"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      // Navigate back to invoices list
      navigate("/invoices");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });
  
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
  
  const getPaymentSourceName = (sourceId: number) => {
    const source = paymentSources?.find(s => s.id === sourceId);
    return source?.name || "Unknown Source";
  };
  
  if (invoiceLoading) {
    return <div>Loading invoice details...</div>;
  }
  
  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
          <CardDescription>
            The invoice you're looking for doesn't exist or has been deleted.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/v2/invoices/${invoiceId}`] });
    setIsEditDialogOpen(false);
  };
  
  return (
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
                {invoice.property_name || "Unknown Property"}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <SlideDialog
                trigger={
                  <Button size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Invoice
                  </Button>
                }
                title="Edit Invoice"
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <InvoiceForm 
                  invoice={invoice as any} 
                  onSuccess={handleEditSuccess} 
                />
              </SlideDialog>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          <div className="mt-2">
            {getStatusBadge(invoice.status)}
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
          
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground">Milestone</p>
            <p>{invoice.milestone || "N/A"}</p>
          </div>
          
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p>{invoice.description || "N/A"}</p>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Payments</h3>
            <PaymentList 
              payments={payments} 
              isLoading={paymentsLoading}
            />
          </div>
        </CardContent>
      </Card>
      
      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate(invoice.id)}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </div>
  );
} 