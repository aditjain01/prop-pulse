import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  loanRepaymentFormSchema,
  type LoanRepaymentFormValues,
  type LoanRepayment,
  type Loan,
  type PaymentSource,
  initializeLoanRepaymentForm,
} from "@/lib/api/schemas";

type LoanRepaymentFormProps = {
  loanId?: number;
  repayment?: LoanRepayment;
  onSuccess?: () => void;
};

export function LoanRepaymentForm({ loanId, repayment, onSuccess }: LoanRepaymentFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showPaymentSourceForm, setShowPaymentSourceForm] = useState(false);

  // Fetch loans for dropdown
  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/loans");
      return res.json();
    }
  });

  // Fetch payment sources for dropdown
  const { data: sources, isLoading: sourcesLoading } = useQuery<PaymentSource[]>({
    queryKey: ["/api/payment-sources"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payment-sources");
      return res.json();
    }
  });

  const form = useForm<LoanRepaymentFormValues>({
    resolver: zodResolver(loanRepaymentFormSchema),
    defaultValues: initializeLoanRepaymentForm(repayment, loanId),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoanRepaymentFormValues) => {
      const endpoint = repayment ? `/api/repayments/${repayment.id}` : "/api/repayments";
      const method = repayment ? "PUT" : "POST";

      const payload = {
        ...data,
        loan_id: parseInt(data.loan_id),
        source_id: parseInt(data.source_id),
        principal_amount: parseFloat(data.principal_amount),
        interest_amount: parseFloat(data.interest_amount),
        other_fees: parseFloat(data.other_fees),
        penalties: parseFloat(data.penalties),
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
        title: repayment ? "Repayment updated" : "Repayment created",
        description: repayment
          ? "The repayment has been updated successfully."
          : "The repayment has been created successfully.",
      });
      if (onSuccess) onSuccess();
      if (!repayment && !loanId) navigate("/repayments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanRepaymentFormValues) => {
    mutation.mutate(data);
  };

  const handleLoanCreated = () => {
    setShowLoanForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
  };

  const handlePaymentSourceCreated = () => {
    setShowPaymentSourceForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{repayment ? "Edit Repayment" : "Create New Repayment"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name="loan_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Loan</FormLabel>
                      <Select
                        disabled={loansLoading || !!loanId}
                        onValueChange={field.onChange}
                        value={field.value}
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
                {!loanId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowLoanForm(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

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
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
                          {sources?.map((source) => (
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
                  onClick={() => setShowPaymentSourceForm(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

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
                          step="0.01"
                          placeholder="0.00"
                          {...field}
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
                          step="0.01"
                          placeholder="0.00"
                          {...field}
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
                          step="0.01"
                          placeholder="0.00"
                          {...field}
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
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="transaction_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cheque number, UPI ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this repayment"
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
                else navigate("/repayments");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : repayment ? "Update Repayment" : "Create Repayment"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Loan Form Dialog */}
      <SlideDialog
        trigger={<></>}
        title="Add Loan"
        open={showLoanForm}
        onOpenChange={setShowLoanForm}
      >
        <LoanForm onSuccess={handleLoanCreated} />
      </SlideDialog>

      {/* Payment Source Form Dialog */}
      <SlideDialog
        trigger={<></>}
        title="Add Payment Source"
        open={showPaymentSourceForm}
        onOpenChange={setShowPaymentSourceForm}
      >
        <PaymentSourceForm onSuccess={handlePaymentSourceCreated} />
      </SlideDialog>
    </>
  );
} 