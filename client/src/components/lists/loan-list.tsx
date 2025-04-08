import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Landmark, Home } from "lucide-react";
import { type LoanPublic } from "@/lib/api/schemas";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Link, useLocation } from "wouter";

type LoanListProps = {
  loans: LoanPublic[] | undefined;
  isLoading: boolean;
};

export function LoanList({ 
  loans, 
  isLoading
}: LoanListProps) {
  const { toast } = useToast();
  const [loanToDelete, setLoanToDelete] = useState<LoanPublic | null>(null);
  const [, navigate] = useLocation();
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      setLoanToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (loan: LoanPublic) => {
    setLoanToDelete(loan);
  };

  const handleViewDetails = (loanId: number) => {
    navigate(`/loans/${loanId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading loans...</div>;
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No loans found. Create your first loan using the "Add Loan" button.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loans.map((loan) => (
          <div key={loan.id} className="relative">
            <Link href={`/loans/${loan.id}`} className="block">
              <Card key={loan.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
                    {loan.loan_number && (
                      <p className="text-sm text-muted-foreground">{loan.loan_number}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={loan.is_active ? "default" : "secondary"}>
                      {loan.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(loan);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-3">
                    <Landmark className="h-5 w-5" />
                    <span>{loan.institution}</span>
                  </div>        
                  <div className="space-y-1 text-sm mb-4">
                    <p><span className="font-medium">Sanctioned Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Disbursed Amount:</span> ₹{Number(loan.total_disbursed_amount).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => deleteMutation.mutate(loanToDelete!.id)}
        title="Delete Loan"
        description={`Are you sure you want to delete this loan? This action cannot be undone.`}
      />
    </>
  );
} 