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
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { InvoiceForm } from "@/components/forms/invoice-form";

type Invoice = {
  id: number;
  invoice_number: string;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  milestone: string | null;
  purchase_id: number;
  [key: string]: any;
};

type InvoiceListProps = {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
};

export function InvoiceList({ 
  invoices, 
  isLoading
}: InvoiceListProps) {
  const { toast } = useToast();
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/invoices"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="relative">
            <Link href={`/invoices/${invoice.id}`} className="block">
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
                  <div className="flex items-center space-x-2">
                    {getStatusBadge("pending")}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setInvoiceToDelete(invoice);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground">Milestone</p>
                    <p className="text-sm">{invoice.milestone? invoice.milestone : "N/A"}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-muted-foreground">
                      <span>Paid: {Math.round((invoice.paid_amount / invoice.amount) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => deleteMutation.mutate(invoiceToDelete!.id)}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${invoiceToDelete?.invoice_number}? This action cannot be undone.`}
      />
    </>
  );
} 