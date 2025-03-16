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
  payment_mode: string;
  [key: string]: any;
};

type RepaymentListProps = {
  repayments: LoanRepayment[] | undefined;
  isLoading: boolean;
  onDeleteRepayment?: (repayment: LoanRepayment) => void;
  onEditRepayment?: (repayment: LoanRepayment) => void;
};

export function RepaymentList({ 
  repayments, 
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

  return (
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
                  {(repayment as any).loan_name || "Unknown Loan"}
                  {(repayment as any).loan_institution && 
                    <span className="text-xs text-muted-foreground block">
                      {(repayment as any).loan_institution}
                    </span>
                  }
                </TableCell>
                <TableCell>{(repayment as any).property_name || ""}</TableCell>
                <TableCell className="font-medium">{formatCurrency((repayment as any).total_payment || 0)}</TableCell>
                <TableCell>{repayment.payment_mode}</TableCell>
                <TableCell>{(repayment as any).source_name || ""}</TableCell>
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