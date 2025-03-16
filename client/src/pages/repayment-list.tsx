import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Pencil, Trash2, Plus, Calendar, CreditCard, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { type LoanRepayment, type Loan } from "@/lib/schemas";
import { RepaymentList } from "@/components/lists/repayment-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RepaymentListProps {
  initialLoanIdFilter?: number;
}

export default function RepaymentListPage({ initialLoanIdFilter }: RepaymentListProps) {
  const { toast } = useToast();
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepayment | null>(null);
  const [repaymentToEdit, setRepaymentToEdit] = useState<LoanRepayment | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<number | undefined>(initialLoanIdFilter);
  
  // Fetch all repayments
  const { data: repayments, isLoading: repaymentsLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/repayments", selectedLoanId ? { loan_id: selectedLoanId } : undefined],
  });

  // Fetch all loans for dropdown
  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

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

  const handleDeleteRepayment = (repayment: LoanRepayment) => {
    setRepaymentToDelete(repayment);
  };

  const handleEditRepayment = (repayment: LoanRepayment) => {
    setRepaymentToEdit(repayment);
  };

  const handleRepaymentFormSuccess = () => {
    queryClient.invalidateQueries({ 
      queryKey: ["/api/repayments", selectedLoanId ? { loan_id: selectedLoanId } : undefined] 
    });
    setRepaymentToEdit(null);
  };

  const handleLoanFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLoanId(value ? parseInt(value) : undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loan Repayments</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Repayment
              </Button>
            }
            title="Add Loan Repayment"
          >
            <LoanRepaymentForm 
              loanId={selectedLoanId}
              onSuccess={handleRepaymentFormSuccess}
            />
          </SlideDialog>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Repayments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-filter" className="block text-sm font-medium mb-1">
                  Filter by Loan
                </label>
                <select
                  id="loan-filter"
                  className="w-full p-2 border rounded-md"
                  value={selectedLoanId || ""}
                  onChange={handleLoanFilterChange}
                >
                  <option value="">All Loans</option>
                  {loans?.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <RepaymentList
          repayments={repayments}
          loans={loans}
          isLoading={repaymentsLoading || loansLoading}
          onDeleteRepayment={handleDeleteRepayment}
          onEditRepayment={handleEditRepayment}
        />
      </main>

      <DeleteConfirmation
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteMutation.mutate(repaymentToDelete!.id)}
        title="Delete Repayment"
        description={`Are you sure you want to delete this repayment? This action cannot be undone.`}
      />

      {/* Repayment edit dialog */}
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
            onSuccess={handleRepaymentFormSuccess}
          />
        </SlideDialog>
      )}
    </div>
  );
} 