import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { useLocation } from "wouter";
import { type Payment, type PaymentSource } from "@/lib/api/schemas";

// type Payment = {
//   id: number;
//   payment_date: string;
//   amount: number;
//   payment_mode: string;
//   invoice_id?: number;
//   [key: string]: any;
// };

// type PaymentSource = {
//   id: number;
//   name: string;
//   [key: string]: any;
// };

type PaymentListProps = {
  payments: Payment[] | undefined;
  paymentSources?: PaymentSource[] | undefined;
  isLoading: boolean;
};

export function PaymentList({ 
  payments, 
  paymentSources,
  isLoading
}: PaymentListProps) {
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [, navigate] = useLocation();

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

  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
  };

  const handleEdit = (payment: Payment) => {
    setPaymentToEdit(payment);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    setPaymentToEdit(null);
  };

  const handleViewPayment = (paymentId: number) => {
    navigate(`/payments/${paymentId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading payments...</div>;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No payments found. Create your first payment using the "Add Payment" button.</p>
      </div>
    );
  }

  // Helper function to format payment mode
  const formatPaymentMode = (mode: string) => {
    if (!mode) return "Unknown";
    
    // Capitalize first letter and replace underscores with spaces
    return mode.charAt(0).toUpperCase() + 
      mode.slice(1).replace(/_/g, ' ');
  };

  return (
    <>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => {
              return (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>#{(payment as any).invoice_number || "Unknown"}</TableCell>
                  <TableCell>{(payment as any).property_name || "Unknown Property"}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{formatPaymentMode(payment.payment_mode)}</TableCell>
                  <TableCell>{(payment as any).source_name || "Unknown Source"}</TableCell>
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
                          onSelect={() => handleViewPayment(payment.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleEdit(payment);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onSelect={() => handleDelete(payment)}
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

      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => deleteMutation.mutate(paymentToDelete!.id)}
        title="Delete Payment"
        description={`Are you sure you want to delete this payment? This action cannot be undone.`}
      />

      {/* Edit dialog */}
        <SlideDialog
          trigger={<Button variant="ghost" className="hidden">Edit Payment</Button>}
          title="Edit Payment"
          open={!!paymentToEdit}
          onOpenChange={(open) => !open && setPaymentToEdit(null)}
        >
          <PaymentForm 
            payment={paymentToEdit as any}
            onSuccess={handleEditSuccess}
          />
        </SlideDialog>
    </>
  );
} 