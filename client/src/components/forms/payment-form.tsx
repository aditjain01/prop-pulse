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
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  paymentFormSchema, 
  type PaymentFormValues, 
  type Payment,
  initializePaymentForm 
} from "@/lib/schemas";

type PaymentFormProps = {
  purchaseId?: number;
  payment?: Payment;
  onSuccess?: () => void;
};

export function PaymentForm({ purchaseId, payment, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentSourceDialogOpen, setPaymentSourceDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch purchases for dropdown
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases/"],
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
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initializePaymentForm(payment, purchaseId),
  });

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const endpoint = payment ? `/api/payments/${payment.id}` : "/api/payments";
      const method = payment ? "PUT" : "POST";
      
      const payload = {
        ...data,
        purchase_id: parseInt(data.purchase_id),
        source_id: parseInt(data.source_id),
      };
      
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/purchases/", purchaseId.toString()] });
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="purchase_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase</FormLabel>
              <Select 
                disabled={!!purchaseId || purchasesLoading} 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a purchase" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {purchases?.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id.toString()}>
                      {getPropertyName(purchase.id)} - ₹{Number(purchase.total_cost).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="source_id"
              render={({ field }) => (
                <FormItem>
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
                        <SelectItem key={source.id} value={source.id ? source.id.toString() : "none"}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <SlideDialog
            trigger={
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
            title="Add Payment Source"
            open={paymentSourceDialogOpen}
            onOpenChange={setPaymentSourceDialogOpen}
          >
            <PaymentSourceForm 
              onSuccess={() => {
                setPaymentSourceDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
              }} 
            />
          </SlideDialog>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online Transfer</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
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
                <FormLabel>Transaction Reference</FormLabel>
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
          name="milestone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Milestone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="booking">Booking Amount</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="plinth">Plinth</SelectItem>
                  <SelectItem value="slab">Slab Casting</SelectItem>
                  <SelectItem value="brick_work">Brick Work</SelectItem>
                  <SelectItem value="plaster">Plaster</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="possession">Possession</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        

        <Separator />

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
