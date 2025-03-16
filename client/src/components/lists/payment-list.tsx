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

type Payment = {
  id: number;
  payment_date: string;
  amount: number;
  payment_mode: string;
  [key: string]: any;
};

type PaymentSource = {
  id: number;
  name: string;
  [key: string]: any;
};

type PaymentListProps = {
  payments: Payment[] | undefined;
  paymentSources?: PaymentSource[] | undefined;
  isLoading: boolean;
  onDeletePayment?: (payment: Payment) => void;
  onEditPayment?: (payment: Payment) => void;
  onViewPayment?: (paymentId: number) => void;
};

export function PaymentList({ 
  payments, 
  paymentSources,
  isLoading, 
  onDeletePayment,
  onEditPayment,
  onViewPayment
}: PaymentListProps) {
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
                      {onViewPayment && (
                        <DropdownMenuItem 
                          onSelect={() => onViewPayment(payment.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEditPayment && (
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          onEditPayment(payment);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDeletePayment && (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onSelect={() => onDeletePayment(payment)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 