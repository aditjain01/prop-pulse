import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/base';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { Plus, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { type LoanRepayment, type Loan } from "@/lib/api/schemas";
import { RepaymentList } from "@/components/lists/repayment-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RepaymentListPage() {
  const { toast } = useToast();
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  
  // Fetch all repayments
  const { data: repayments, isLoading: repaymentsLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/repayments", { loan_id: selectedLoanId }],
    queryFn: async () => {
      const endpoint = selectedLoanId 
        ? `/api/repayments?loan_id=${selectedLoanId}`
        : "/api/repayments";
      const res = await apiRequest("GET", endpoint);
      return res.json();
    }
  });

  // Fetch all loans for dropdown
  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/loans");
      return res.json();
    }
  });

  const handleSuccess = () => {
    // Invalidate the repayments query with the current filter
    queryClient.invalidateQueries({ 
      queryKey: ["/api/repayments", { loan_id: selectedLoanId }]
    });
  };

  const handleLoanFilterChange = (value: string) => {
    setSelectedLoanId(value === "all" ? null : parseInt(value));
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
              loanId={selectedLoanId || undefined}
              onSuccess={handleSuccess}
            />
          </SlideDialog>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Filter Repayments</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Select
              value={selectedLoanId ? selectedLoanId.toString() : "all"}
              onValueChange={handleLoanFilterChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Loans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Loans</SelectItem>
                {loans?.map(loan => (
                  <SelectItem key={loan.id} value={loan.id.toString()}>
                    {loan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <RepaymentList
          repayments={repayments}
          isLoading={repaymentsLoading || loansLoading}
        />
      </main>
    </div>
  );
} 