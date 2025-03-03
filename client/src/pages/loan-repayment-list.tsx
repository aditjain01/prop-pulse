import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/loan-repayment-form";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Pencil, Trash2, Plus, Calendar, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type LoanRepayment } from "@/lib/schemas";

export default function LoanRepaymentList() {
  const { toast } = useToast();
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepayment | null>(null);
  
  // Fetch loan repayments
  const { data: repayments, isLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/loan-repayments"],
  });
  
  // Fetch loans to get loan names
  const { data: loans } = useQuery({
    queryKey: ["/api/loans"],
  });
  
  // Fetch payment sources to get source names
  const { data: paymentSources } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  // Function to get loan name
  const getLoanName = (loanId: number) => {
    const loan = loans?.find(l => l.id === loanId);
    return loan ? `${loan.name} - ${loan.institution}` : "Unknown Loan";
  };
  
  // Function to get payment source name
  const getSourceName = (sourceId: number) => {
    const source = paymentSources?.find(s => s.id === sourceId);
    return source ? source.name : "Unknown Source";
  };
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loan-repayments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-repayments"] });
      toast({
        title: "Repayment deleted",
        description: "The loan repayment has been deleted successfully.",
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
            <LoanRepaymentForm />
          </SlideDialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading repayments...</p>
          </div>
        ) : repayments && repayments.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Loan</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Other Fees</TableHead>
                  <TableHead>Penalties</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repayments.map((repayment) => (
                  <TableRow key={repayment.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(repayment.payment_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getLoanName(repayment.loan_id)}</TableCell>
                    <TableCell>₹{Number(repayment.principal_amount).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(repayment.interest_amount).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(repayment.other_fees).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(repayment.penalties).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₹{Number(repayment.total_payment).toLocaleString()}</TableCell>
                    <TableCell>{getSourceName(repayment.source_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                        {repayment.payment_mode.charAt(0).toUpperCase() + repayment.payment_mode.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <SlideDialog
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                          title="Edit Loan Repayment"
                        >
                          <LoanRepaymentForm 
                            repayment={repayment} 
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/loan-repayments"] })}
                          />
                        </SlideDialog>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setRepaymentToDelete(repayment)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p>No repayments found.</p>
          </div>
        )}
      </main>
    </div>
  );
} 