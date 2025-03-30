import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { type Loan, type LoanRepayment } from "@/lib/schemas";

interface LoanDetailProps {
  loanId: number;
  onDelete?: () => void;
  onClose?: () => void;
}

export function LoanDetail({ loanId, onDelete, onClose }: LoanDetailProps) {
  // Fetch loan details
  const { data: loan, isLoading } = useQuery<Loan>({
    queryKey: [`/api/loans/${loanId}`],
    enabled: !!loanId,
  });

  // Fetch repayments for the loan
  const { data: repayments } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/repayments", { loan_id: loanId }],
    enabled: !!loanId,
  });

  if (isLoading || !loan) {
    return <div>Loading...</div>;
  }

  // Calculate outstanding principal
  const totalPrincipalPaid = repayments?.reduce(
    (sum, repayment) => sum + repayment.principal_amount,
    0
  ) || 0;
  
  const outstandingPrincipal = loan.total_disbursed_amount - totalPrincipalPaid;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{loan.name}</h2>
        <div className="flex space-x-2">
          <SlideDialog
            trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Edit</Button>}
            title="Edit Loan"
          >
            <LoanForm loan={loan} />
          </SlideDialog>
          
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Sanction Date</h3>
            <p className="mt-1">{loan.sanction_date}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Sanction Amount</h3>
            <p className="mt-1">₹{loan.sanction_amount?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Disbursed Amount</h3>
            <p className="mt-1">₹{loan.total_disbursed_amount?.toLocaleString() || 0}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Outstanding Principal</h3>
            <p className="mt-1 font-semibold">₹{outstandingPrincipal.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Interest Rate</h3>
            <p className="mt-1">{loan.interest_rate}%</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Tenure</h3>
            <p className="mt-1">{loan.tenure_months} months</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Institution</h3>
            <p className="mt-1">{loan.institution}</p>
          </div>
          {loan.agent && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Agent</h3>
              <p className="mt-1">{loan.agent}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Processing Fee</h3>
            <p className="mt-1">₹{loan.processing_fee?.toLocaleString() || 0}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Other Charges</h3>
            <p className="mt-1">₹{loan.other_charges?.toLocaleString() || 0}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Sanction Charges</h3>
            <p className="mt-1">₹{loan.loan_sanction_charges?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <p className="mt-1">{loan.is_active ? "Active" : "Inactive"}</p>
        </div>
      </div>

      {onClose && (
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
} 