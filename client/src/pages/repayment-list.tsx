import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
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
  const [selectedLoanId, setSelectedLoanId] = useState<number | undefined>(initialLoanIdFilter);
  
  // Fetch all repayments
  const { data: repayments, isLoading: repaymentsLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/v2/repayments", selectedLoanId ? { loan_id: selectedLoanId } : undefined],
  });

  // Fetch all loans for dropdown
  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/v2/loans"],
  });

  const handleRepaymentFormSuccess = () => {
    queryClient.invalidateQueries({ 
      queryKey: ["/api/v2/repayments", selectedLoanId ? { loan_id: selectedLoanId } : undefined] 
    });
  };

  const handleLoanFilterChange = (value: string) => {
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
                <Select
                  value={selectedLoanId?.toString() || ""}
                  onValueChange={handleLoanFilterChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Loans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Loans</SelectItem>
                    {loans?.map(loan => (
                      <SelectItem key={loan.id} value={loan.id.toString()}>
                        {loan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
          </div>
                      </div>
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