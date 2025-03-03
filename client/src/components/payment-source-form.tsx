import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useState } from "react";

type PaymentSourceFormProps = {
  paymentSource?: any;
  onSuccess?: () => void;
};

const paymentSourceSchema = z.object({
  name: z.string().nonempty("Name is required"),
  source_type: z.string().nonempty("Source type is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  
  // Bank account fields
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  branch: z.string().optional(),
  
  // Loan fields
  lender: z.string().optional(),
  
  // Credit card fields
  card_number: z.string().optional(),
  card_expiry: z.string().optional(),
  
  // Digital wallet fields
  wallet_provider: z.string().optional(),
  wallet_identifier: z.string().optional(),
});

export function PaymentSourceForm({ paymentSource, onSuccess }: PaymentSourceFormProps) {
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState(paymentSource?.source_type || "bank_account");
  
  const form = useForm({
    resolver: zodResolver(paymentSourceSchema),
    defaultValues: paymentSource || {
      name: "",
      source_type: "bank_account",
      description: "",
      is_active: true,
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      branch: "",
      lender: "",
      card_number: "",
      card_expiry: "",
      wallet_provider: "",
      wallet_identifier: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = paymentSource 
        ? `/api/payment-sources/${paymentSource.id}` 
        : "/api/payment-sources";
      
      const method = paymentSource ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
      
      toast({
        title: paymentSource ? "Payment source updated" : "Payment source created",
        description: "The payment source has been saved successfully.",
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

  // Fetch loans for the dropdown
  const { data: loans } = useQuery({
    queryKey: ["/api/loans"],
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., HDFC Savings Account" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Type</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSourceType(value);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Optional description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Conditional fields based on source type */}
        {sourceType === "bank_account" && (
          <>
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., HDFC Bank" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XXXX XXXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifsc_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., HDFC0001234" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Koramangala, Bangalore" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {sourceType === "loan" && (
          <FormField
            control={form.control}
            name="loan_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Loan</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a loan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loans?.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id.toString()}>
                        {loan.name} - ₹{Number(loan.sanction_amount).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {sourceType === "credit_card" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="card_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="XXXX XXXX XXXX XXXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="card_expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="MM/YY" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {sourceType === "digital_wallet" && (
          <>
            <FormField
              control={form.control}
              name="wallet_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Provider</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., PayTM, PhonePe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wallet_identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Identifier</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Phone number or email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending 
            ? (paymentSource ? "Updating..." : "Creating...") 
            : (paymentSource ? "Update Payment Source" : "Create Payment Source")}
        </Button>
      </form>
    </Form>
  );
} 