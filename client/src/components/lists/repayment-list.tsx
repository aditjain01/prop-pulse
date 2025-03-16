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

type LoanRepayment = {
  id: number;
  loan_id: number;
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  other_fees: number;
  penalties: number;
  payment_mode: string;
  transaction_reference: string | null;
  notes: string | null;
  [key: string]: any;
};

type Loan = {
  id: number;
  name: string;
  institution: string;
  [key: string]: any;
};

type RepaymentListProps = {
  repayments: LoanRepayment[] | undefined;
  loans?: Loan[] | undefined;
  isLoading: boolean;
  onDeleteRepayment?: (repayment: LoanRepayment) => void;
  onEditRepayment?: (repayment: LoanRepayment) => void;
};

export function RepaymentList({ 
  repayments, 
  loans, 
  isLoading, 
  onDeleteRepayment,
  onEditRepayment
}: RepaymentListProps) {
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

  // Helper function to get loan name
  const getLoanName = (loanId: number): string => {
    if (!loans) return "Unknown Loan";
    
    const loan = loans.find(l => l.id === loanId);
    return loan ? `${loan.name} - ${loan.institution}` : "Unknown Loan";
  };

  // Helper function to calculate total amount
  const calculateTotal = (repayment: LoanRepayment): number => {
    return (
      (repayment.principal_amount || 0) +
      (repayment.interest_amount || 0) +
      (repayment.other_fees || 0) +
      (repayment.penalties || 0)
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Principal</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Other Fees</TableHead>
            <TableHead>Penalties</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repayments.map(repayment => {
            const total = calculateTotal(repayment);
            
            return (
              <TableRow key={repayment.id}>
                <TableCell>{formatDate(repayment.payment_date)}</TableCell>
                <TableCell>{formatCurrency(repayment.principal_amount)}</TableCell>
                <TableCell>{formatCurrency(repayment.interest_amount)}</TableCell>
                <TableCell>{formatCurrency(repayment.other_fees)}</TableCell>
                <TableCell>{formatCurrency(repayment.penalties)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                <TableCell>{repayment.payment_mode}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {onEditRepayment && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditRepayment(repayment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteRepayment && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDeleteRepayment(repayment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 