import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, FileText } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Invoice = {
  id: number;
  invoice_number: string;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  milestone: string | null;
  [key: string]: any;
};

type InvoiceListProps = {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
  onDeleteInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
};

export function InvoiceList({ 
  invoices, 
  isLoading, 
  onDeleteInvoice,
  onEditInvoice 
}: InvoiceListProps) {
  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading invoices...</div>;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No invoices found. Create your first invoice using the "New Invoice" button.</p>
      </div>
    );
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    let variant = "default";
    
    switch (status.toLowerCase()) {
      case "paid":
        variant = "success";
        break;
      case "pending":
        variant = "warning";
        break;
      case "overdue":
        variant = "destructive";
        break;
      case "cancelled":
        variant = "secondary";
        break;
      default:
        variant = "default";
    }
    
    return (
      <Badge variant={variant as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">
                Invoice #{invoice.invoice_number}
              </CardTitle>
              <CardDescription className="text-sm">
                {(invoice as any).property_name || "Unknown Property"}
              </CardDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-semibold">{formatCurrency(invoice.amount)}</p>
              </div>
            </div>
            
            {invoice.milestone && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Milestone</p>
                <p className="text-sm">{invoice.milestone}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-muted-foreground">
                {invoice.paid_amount > 0 && (
                  <span>Paid: {Math.round((invoice.paid_amount / invoice.amount) * 100)}%</span>
                )}
              </div>
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
                  <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {onEditInvoice && (
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      onEditInvoice(invoice);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDeleteInvoice && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onSelect={() => onDeleteInvoice(invoice)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 