import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { z } from 'zod';
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentSourceForm } from "@/components/payment-source-form";
import { Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type PaymentFormProps = {
  purchaseId?: number;
  payment?: any;
  onSuccess?: () => void;
};

const paymentSchema = z.object({
  purchase_id: z.string().nonempty("Purchase is required"),
  payment_date: z.string(),
  amount: z.number(),
  payment_source_id: z.string().nonempty("Payment source is required"),
  payment_mode: z.string(),
  transaction_reference: z.string().optional(),
  milestone: z.string().optional(),
  // Invoice details
  invoice_date: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_amount: z.number().optional(),
  // Receipt details
  receipt_date: z.string().optional(),
  receipt_number: z.string().optional(),
  receipt_amount: z.number().optional(),
});

export function PaymentForm({ purchaseId, payment, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentSourceDialogOpen, setPaymentSourceDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch purchases for dropdown
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch properties to display property names with purchases
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });
  
  // Fetch payment sources
  const { data: paymentSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  // Helper function to get property name for a purchase
  const getPropertyName = (purchaseId: number) => {
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    const property = properties?.find(p => p.id === purchase.property_id);
    return property?.name || "Unknown Property";
  };
  
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? {
      purchase_id: payment.purchase_id.toString(),
      payment_date: payment.payment_date,
      amount: payment.amount,
      payment_source_id: payment.payment_source_id.toString(),
      payment_mode: payment.payment_mode,
      transaction_reference: payment.transaction_reference || "",
      milestone: payment.milestone || "",
      // Invoice details
      invoice_date: payment.invoice_date || "",
      invoice_number: payment.invoice_number || "",
      invoice_amount: payment.invoice_amount || 0,
      // Receipt details
      receipt_date: payment.receipt_date || "",
      receipt_number: payment.receipt_number || "",
      receipt_amount: payment.receipt_amount || 0,
    } : {
      purchase_id: purchaseId?.toString() || "",
      payment_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_source_id: "",
      payment_mode: "online",
      transaction_reference: "",
      milestone: "",
      // Invoice details
      invoice_date: "",
      invoice_number: "",
      invoice_amount: 0,
      // Receipt details
      receipt_date: "",
      receipt_number: "",
      receipt_amount: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = payment ? `/api/payments/${payment.id}` : "/api/payments";
      const method = payment ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, {
        ...data,
        purchase_id: parseInt(data.purchase_id),
        payment_source_id: parseInt(data.payment_source_id),
        amount: parseFloat(data.amount),
        invoice_amount: data.invoice_amount ? parseFloat(data.invoice_amount) : null,
        receipt_amount: data.receipt_amount ? parseFloat(data.receipt_amount) : null,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", parseInt(form.getValues().purchase_id)] });
      
      toast({
        title: payment ? "Payment updated" : "Payment recorded",
        description: payment 
          ? "The payment has been updated successfully." 
          : "The payment has been recorded successfully.",
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaymentSourceCreated = () => {
    setPaymentSourceDialogOpen(false);
    // Refresh the payment sources list
    queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        {/* Section 1: Basic Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Purchase Selection Field */}
            <FormField
              control={form.control}
              name="purchase_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!purchaseId} // Disable if purchaseId is provided
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purchase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {purchases?.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id.toString()}>
                          {getPropertyName(purchase.id)} - ₹{Number(purchase.base_cost).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_source_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Source</FormLabel>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
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
                    </div>
                    <SlideDialog
                      trigger={
                        <Button variant="outline" size="icon" type="button">
                          <Plus className="h-4 w-4" />
                        </Button>
                      }
                      title="Add Payment Source"
                      open={paymentSourceDialogOpen}
                      onOpenChange={setPaymentSourceDialogOpen}
                    >
                      <PaymentSourceForm onSuccess={handlePaymentSourceCreated} />
                    </SlideDialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="dd">Demand Draft</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                  <FormLabel>Transaction Reference</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Milestone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoice_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: Receipt Details */}
        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receipt_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
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
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="receipt_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={mutation.isPending || !paymentSources?.length}>
          {mutation.isPending ? (payment ? "Updating Payment..." : "Recording Payment...") : (payment ? "Update Payment" : "Record Payment")}
        </Button>
      </form>
    </Form>
  );
}
