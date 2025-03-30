import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useState } from "react";
import { useLocation } from "wouter";

// Define the schema for the form
const invoiceFormSchema = z.object({
  purchase_id: z.string().min(1, "Property purchase is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  status: z.string().min(1, "Status is required"),
  milestone: z.string().optional(),
  description: z.string().optional(),
});

// Define the type for the form values
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Define the type for the invoice object
export type Invoice = {
  id: number;
  purchase_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  amount: number;
  paid_amount: number;
  status: string;
  milestone?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
};

// Helper function to initialize form values
const initializeInvoiceForm = (invoice?: Invoice, purchaseId?: number): InvoiceFormValues => {
  return {
    purchase_id: invoice ? invoice.purchase_id.toString() : purchaseId ? purchaseId.toString() : "",
    invoice_number: invoice?.invoice_number || "",
    invoice_date: invoice?.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : "",
    amount: invoice?.amount ? invoice.amount.toString() : "",
    status: invoice?.status || "pending",
    milestone: invoice?.milestone || "",
    description: invoice?.description || "",
  };
};

type InvoiceFormProps = {
  purchaseId?: number;
  invoice?: Invoice;
  onSuccess?: () => void;
};

export function InvoiceForm({ purchaseId, invoice, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch purchases for dropdown
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases/"],
  });
  
  // Fetch properties to display property names with purchases
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });
  
  // Helper function to get property name for a purchase
  const getPropertyName = (purchaseId: number) => {
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    const property = properties?.find(p => p.id === purchase.property_id);
    return property?.name || "Unknown Property";
  };
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initializeInvoiceForm(invoice, purchaseId),
  });

  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const endpoint = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices";
      const method = invoice ? "PUT" : "POST";
      
      const payload = {
        ...data,
        purchase_id: parseInt(data.purchase_id),
        amount: parseFloat(data.amount),
      };
      
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/purchases/", purchaseId.toString()] });
      }
      toast({
        title: invoice ? "Invoice updated" : "Invoice created",
        description: invoice 
          ? "The invoice has been updated successfully." 
          : "The invoice has been created successfully.",
      });
      if (onSuccess) onSuccess();
      if (!invoice) navigate("/invoices");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="purchase_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Purchase</FormLabel>
                  <Select
                    disabled={purchasesLoading || !!purchaseId}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property purchase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {purchases?.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id.toString()}>
                          {getPropertyName(purchase.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="milestone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Booking, Foundation, Possession" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details about this invoice" 
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
              else navigate("/invoices");
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 