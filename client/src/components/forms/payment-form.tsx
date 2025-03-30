import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/base';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { Plus, ExternalLink, FileText } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { 
  paymentFormSchema, 
  type PaymentFormValues, 
  type Payment,
  initializePaymentForm,
  type InvoicePublic
} from "@/lib/api/schemas";
import { formatCurrency } from "@/lib/utils";

type PaymentFormProps = {
  invoiceId?: number;
  payment?: Payment;
  onSuccess?: () => void;
};

export function PaymentForm({ invoiceId, payment, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentSourceDialogOpen, setPaymentSourceDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch invoices for dropdown
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<InvoicePublic[]>({
    queryKey: ["/api/invoices"],
  });
  
  // Fetch purchases for displaying property names
  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch payment sources
  const { data: paymentSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  // Helper function to get property name for an invoice
  const getInvoiceDetails = (invoiceId: number) => {
    const invoice = invoices?.find(i => i.id === invoiceId);
    if (!invoice) return { label: "Unknown Invoice", amount: 0, paid: 0, balance: 0 };
    
    const purchase = purchases?.find(p => p.id === invoice.purchase_id);
    if (!purchase) return { 
      label: `Invoice #${invoice.invoice_number}`, 
      amount: invoice.amount,
      paid: invoice.paid_amount,
      balance: invoice.amount - invoice.paid_amount
    };
        
    return {
      label: `${invoice.property_name} - Invoice #${invoice.invoice_number}`,
      amount: invoice.amount,
      paid: invoice.paid_amount,
      balance: invoice.amount - invoice.paid_amount
    };
  };
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initializePaymentForm(payment, invoiceId),
  });

  // Watch the invoice_id to update the amount field
  const selectedInvoiceId = form.watch("invoice_id");
  
  // Update amount when invoice changes
  const updateAmountBasedOnInvoice = (invoiceId: string) => {
    if (!invoiceId) return;
    
    const id = parseInt(invoiceId);
    const invoice = invoices?.find(i => i.id === id);
    if (invoice) {
      const balance = Number(invoice.amount) - Number(invoice.paid_amount);
      form.setValue("amount", balance.toString());
    }
  };
  
  // Effect to update amount when invoice changes
  useEffect(() => {
    if (selectedInvoiceId && !payment) {
      updateAmountBasedOnInvoice(selectedInvoiceId);
    }
  }, [selectedInvoiceId, invoices]);

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const endpoint = payment ? `/api/payments/${payment.id}` : "/api/payments";
      const method = payment ? "PUT" : "POST";
      
      const payload = {
        ...data,
        invoice_id: parseInt(data.invoice_id),
        source_id: parseInt(data.source_id),
        amount: data.amount,  // Let the API handle the conversion
      };
      
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      }
      
      toast({
        title: payment ? "Payment updated" : "Payment recorded",
        description: payment 
          ? "The payment has been updated successfully." 
          : "The payment has been recorded successfully.",
      });
      
      if (onSuccess) onSuccess();
      if (!payment) navigate("/payments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    mutation.mutate(data);
  };
  
  const handleInvoiceCreated = () => {
    setInvoiceDialogOpen(false);
    refetchInvoices();
    toast({
      title: "Invoice created",
      description: "The invoice has been created successfully. You can now select it for this payment.",
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{payment ? "Edit Payment" : "Record Payment"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="invoice_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Invoice</FormLabel>
                      <Select
                        disabled={invoicesLoading || !!invoiceId}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (!payment) {
                            updateAmountBasedOnInvoice(value);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an invoice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoices?.map((invoice) => {
                            const details = getInvoiceDetails(invoice.id);
                            return (
                              <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                {details.label} ({formatCurrency(details.balance)} remaining)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setInvoiceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {selectedInvoiceId && (
                <div className="bg-muted p-3 rounded-md">
                  {(() => {
                    const details = getInvoiceDetails(parseInt(selectedInvoiceId));
                    return (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium">{formatCurrency(details.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid Amount</p>
                          <p className="font-medium">{formatCurrency(details.paid)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-medium">{formatCurrency(details.balance)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="source_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Payment Source</FormLabel>
                      <Select
                        disabled={sourcesLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentSources?.map((source) => (
                            <SelectItem key={source.id} value={source.id.toString()}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPaymentSourceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cheque number, UPI ID, Transaction ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receipt_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receipt_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., REC-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this payment"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onSuccess) onSuccess();
                else navigate("/payments");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : payment ? "Update Payment" : "Record Payment"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Payment Source Dialog */}
      <SlideDialog
        trigger={<></>}
        title="Add Payment Source"
        open={paymentSourceDialogOpen}
        onOpenChange={setPaymentSourceDialogOpen}
      >
        <PaymentSourceForm onSuccess={() => {
          setPaymentSourceDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
        }} />
      </SlideDialog>

      {/* Invoice Dialog */}
      <SlideDialog
        trigger={<></>}
        title="Create Invoice"
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      >
        <InvoiceForm onSuccess={handleInvoiceCreated} />
      </SlideDialog>
    </>
  );
}
