import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { type LoanRepayment as SchemaLoanRepayment } from "@/lib/schemas";

// Local type definition for compatibility with existing code
type LoanRepayment = SchemaLoanRepayment & {
  loan_id?: number;  // Optional for backward compatibility
};

type RepaymentListProps = {
  repayments: LoanRepayment[] | undefined;
  isLoading: boolean;
};

export function RepaymentList({ 
  repayments, 
  isLoading
}: RepaymentListProps) {
  const { toast } = useToast();
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepayment | null>(null);
  const [repaymentToEdit, setRepaymentToEdit] = useState<LoanRepayment | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/repayments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      toast({
        title: "Repayment deleted",
        description: "The repayment has been deleted successfully.",
      });
      setRepaymentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (repayment: LoanRepayment) => {
    setRepaymentToDelete(repayment);
  };

  const handleEdit = (repayment: LoanRepayment) => {
    setRepaymentToEdit(repayment);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
    setRepaymentToEdit(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading repayments...</div>;
  }

  if (!repayments || repayments.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No repayments found. Create your first repayment using the "Add Repayment" button.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repayments.map(repayment => {
              return (
                <TableRow key={repayment.id}>
                  <TableCell>{formatDate(repayment.payment_date)}</TableCell>
                  <TableCell>
                    {repayment.loan_name || "Unknown Loan"}
                    {repayment.loan_institution && 
                      <span className="text-xs text-muted-foreground block">
                        {repayment.loan_institution}
                      </span>
                    }
                  </TableCell>
                  <TableCell>{repayment.property_name || ""}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(repayment.total_payment || 0)}</TableCell>
                  <TableCell>{repayment.payment_mode}</TableCell>
                  <TableCell>{repayment.source_name || ""}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(repayment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(repayment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteMutation.mutate(repaymentToDelete!.id)}
        title="Delete Repayment"
        description={`Are you sure you want to delete this repayment? This action cannot be undone.`}
      />

      {/* Edit dialog */}
      {repaymentToEdit && (
        <SlideDialog
          trigger={<></>}
          title="Edit Loan Repayment"
          open={!!repaymentToEdit}
          onOpenChange={(open) => !open && setRepaymentToEdit(null)}
        >
          <LoanRepaymentForm 
            loanId={repaymentToEdit.loan_id}
            repayment={repaymentToEdit}
            onSuccess={handleEditSuccess}
          />
        </SlideDialog>
      )}
    </>
  );
} 