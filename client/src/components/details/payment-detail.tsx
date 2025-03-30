import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { ArrowLeft, FileText, Pencil, Receipt, Trash2 } from "lucide-react";
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
import { InvoiceList } from "@/components/lists/invoice-list";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Payment} from "@/lib/api/schemas";

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

interface PaymentSource {
  id: number;
  name: string;
  [key: string]: any;
}

type PaymentDetailProps = {
  paymentId: number;
  // onEdit?: (payment: Payment) => void;
  // onDelete?: () => void;
  // onClose?: () => void;
};

export function PaymentDetail({ paymentId }: PaymentDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch payment details
  const { data: payment, isLoading: paymentLoading } = useQuery<Payment>({
    queryKey: [`/api/payments/${paymentId}`],
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
  
  // Delete payment mutation
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
      // Navigate back to payments list or call onDelete
      navigate("/payments");
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

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/payments/${paymentId}`] });
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  const handleConfirmDelete = () => {
    deleteMutation.mutate(paymentId);
    setShowDeleteDialog(false);
  };
  
  return (
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
                {payment.property_name} - {payment.invoice_number}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <SlideDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Payment
                  </Button>
                }
                title="Edit Payment"
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <PaymentForm 
                  payment={payment}
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
              <p>{payment.source_name}</p>
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
          
          {payment.receipt_date && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receipt Date</p>
                <p>{formatDate(payment.receipt_date)}</p>
              </div>
              {payment.receipt_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                  <p>{payment.receipt_number}</p>
                </div>
              )}
            </div>
          )}
          
          {payment.notes && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p>{payment.notes}</p>
            </div>
          )}
        
        </CardContent>
      </Card>
      
      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? This action cannot be undone."
      />
    </div>
  );
}