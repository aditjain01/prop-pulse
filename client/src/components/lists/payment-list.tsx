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
  invoice_id: number;
  payment_date: string;
  amount: number;
  source_id: number;
  payment_mode: string;
  transaction_reference: string | null;
  [key: string]: any;
};

type Invoice = {
  id: number;
  invoice_number: string;
  purchase_id: number;
  [key: string]: any;
};

type Purchase = {
  id: number;
  property_id: number;
  property?: { name: string; id: number };
  [key: string]: any;
};

type Property = {
  id: number;
  name: string;
  [key: string]: any;
};

type PaymentSource = {
  id: number;
  name: string;
  [key: string]: any;
};

type PaymentListProps = {
  payments: Payment[] | undefined;
  invoices?: Invoice[] | undefined;
  purchases?: Purchase[] | undefined;
  properties?: Property[] | undefined;
  paymentSources?: PaymentSource[] | undefined;
  isLoading: boolean;
  onDeletePayment?: (payment: Payment) => void;
  onEditPayment?: (payment: Payment) => void;
  onViewPayment?: (paymentId: number) => void;
};

export function PaymentList({ 
  payments, 
  invoices, 
  purchases, 
  properties, 
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

  // Helper function to get invoice details
  const getInvoiceDetails = (invoiceId: number) => {
    if (!invoices) return { number: "Unknown", property: "Unknown Property" };
    
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return { number: "Unknown", property: "Unknown Property" };
    
    let propertyName = "Unknown Property";
    
    if (purchases && properties) {
      const purchase = purchases.find(p => p.id === invoice.purchase_id);
      if (purchase) {
        if (purchase.property) {
          propertyName = purchase.property.name;
        } else if (purchase.property_id) {
          const property = properties.find(p => p.id === purchase.property_id);
          if (property) {
            propertyName = property.name;
          }
        }
      }
    }
    
    return {
      number: invoice.invoice_number,
      property: propertyName
    };
  };
  
  // Helper function to get payment source name
  const getSourceName = (sourceId: number) => {
    if (!paymentSources) return "Unknown Source";
    
    const source = paymentSources.find(s => s.id === sourceId);
    return source ? source.name : "Unknown Source";
  };
  
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
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => {
            const invoiceDetails = getInvoiceDetails(payment.invoice_id);
            
            return (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>#{invoiceDetails.number}</TableCell>
                <TableCell>{invoiceDetails.property}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{formatPaymentMode(payment.payment_mode)}</TableCell>
                <TableCell>{getSourceName(payment.source_id)}</TableCell>
                <TableCell>{payment.transaction_reference || "-"}</TableCell>
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