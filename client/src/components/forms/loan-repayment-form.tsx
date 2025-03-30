import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  loanRepaymentFormSchema, 
  type LoanRepaymentFormValues, 
  type LoanRepayment,
  initializeLoanRepaymentForm 
} from "@/lib/schemas";

type LoanRepaymentFormProps = {
  loanId?: number;
  repayment?: LoanRepayment;
  onSuccess?: () => void;
};

export function LoanRepaymentForm({ loanId, repayment, onSuccess }: LoanRepaymentFormProps) {
  const { toast } = useToast();
  const [paymentSourceDialogOpen, setPaymentSourceDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch loans for dropdown
  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
  });
  
  // Fetch payment sources
  const { data: paymentSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/payment-sources"],
  });
  
  const form = useForm<LoanRepaymentFormValues>({
    resolver: zodResolver(loanRepaymentFormSchema),
    defaultValues: initializeLoanRepaymentForm(repayment, loanId),
    mode: "onChange",
  });

  // Calculate total payment
  const principalAmount = Number(form.watch("principal_amount")) || 0;
  const interestAmount = Number(form.watch("interest_amount")) || 0;
  const otherFees = Number(form.watch("other_fees")) || 0;
  const penalties = Number(form.watch("penalties")) || 0;
  const totalPayment = principalAmount + interestAmount + otherFees + penalties;

  const mutation = useMutation({
    mutationFn: async (data: LoanRepaymentFormValues) => {
      const endpoint = repayment ? `/api/repayments/${repayment.id}` : "/api/repayments";
      const method = repayment ? "PUT" : "POST";
      
      const payload = {
        ...data,
        loan_id: parseInt(data.loan_id),
        source_id: parseInt(data.source_id),
        principal_amount: Number(data.principal_amount),
        interest_amount: Number(data.interest_amount),
        other_fees: Number(data.other_fees),
        penalties: Number(data.penalties),
      };
      
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      if (loanId) {
        queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId.toString()] });
      }
      toast({
        title: repayment ? "Repayment updated" : "Repayment recorded",
        description: repayment 
          ? "The loan repayment has been updated successfully." 
          : "The loan repayment has been recorded successfully.",
      });
      if (onSuccess) onSuccess();
      if (!repayment) navigate("/repayments");
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
      <form onSubmit={form.handleSubmit((data) => {
        // Ensure all numeric values are properly parsed
        const formattedData = {
          ...data,
          principal_amount: Number(data.principal_amount),
          interest_amount: Number(data.interest_amount),
          other_fees: Number(data.other_fees),
          penalties: Number(data.penalties),
        };
        mutation.mutate(formattedData);
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="loan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan</FormLabel>
              <Select 
                disabled={!!loanId || loansLoading} 
                onValueChange={field.onChange} 
                value={field.value || ""} // Ensure value is not undefined
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loans?.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id.toString()}>
                      {loan.name} - {loan.institution}
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
            name="source_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Payment Source</FormLabel>
                  <SlideDialog
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => setPaymentSourceDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New
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
                <Select 
                  disabled={sourcesLoading} 
                  onValueChange={field.onChange} 
                  value={field.value || ""} // Ensure value is not undefined
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="other_fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Fees (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="penalties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalties (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Payment:</span>
                <span className="font-bold text-lg">₹{totalPayment.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}> // Ensure value is not undefined
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="auto_debit">Auto Debit</SelectItem>
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={mutation.isPending || !paymentSources?.length}>
          {mutation.isPending ? (repayment ? "Updating Repayment..." : "Recording Repayment...") : (repayment ? "Update Repayment" : "Record Repayment")}
        </Button>
      </form>
    </Form>
  );
} 