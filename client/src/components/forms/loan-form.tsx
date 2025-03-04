import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { 
  loanFormSchema, 
  type LoanFormValues, 
  type Loan,
  initializeLoanForm 
} from "@/lib/schemas";

type LoanFormProps = {
  purchaseId?: number;
  loan?: Loan;
  onSuccess?: () => void;
};

export function LoanForm({ loan, purchaseId, onSuccess }: LoanFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch purchases for dropdown
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch properties to get property names
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });
  
  // Function to get property name for a purchase
  const getPropertyName = (purchaseId: number) => {
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    // If purchase has property object directly
    if (purchase.property && purchase.property.name) {
      return purchase.property.name;
    }
    
    // If purchase only has property_id
    if (purchase.property_id) {
      const property = properties?.find(p => p.id === purchase.property_id);
      return property ? property.name : "Unknown Property";
    }
    
    return "Unknown Property";
  };

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: initializeLoanForm(loan, purchaseId),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoanFormValues) => {
      const endpoint = loan ? `/api/loans/${loan.id}` : "/api/loans";
      const method = loan ? "PUT" : "POST";
      
      const payload = {
        ...data,
        purchase_id: parseInt(data.purchase_id),
        sanction_amount: parseFloat(data.sanction_amount.toString()),
        processing_fee: parseFloat(data.processing_fee.toString()),
        other_charges: parseFloat(data.other_charges.toString()),
        loan_sanction_charges: parseFloat(data.loan_sanction_charges.toString()),
        interest_rate: parseFloat(data.interest_rate.toString()),
        tenure_months: parseInt(data.tenure_months.toString()),
      };
      
      // When updating, only send changed fields
      const finalPayload = loan ? 
        Object.fromEntries(
          Object.entries(payload).filter(([key, value]) => 
            JSON.stringify(loan[key as keyof typeof loan]) !== JSON.stringify(value)
          )
        ) : 
        payload;
      
      return apiRequest(method, endpoint, finalPayload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      if (purchaseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/purchases", purchaseId.toString(), "loans"] });
      }
      
      toast({
        title: loan ? "Loan updated" : "Loan created",
        description: loan 
          ? "The loan has been updated successfully." 
          : "The loan has been created successfully.",
      });
      
      if (onSuccess) onSuccess();
      if (!loan && !purchaseId) setLocation(`/loans`);
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
              <FormLabel>Property Purchase</FormLabel>
              <Select 
                disabled={!!purchaseId || purchasesLoading} 
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
                      {getPropertyName(purchase.id)} - {new Date(purchase.purchase_date).toLocaleDateString()}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institution</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sanction_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sanction Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sanction_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sanction Amount (₹)</FormLabel>
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

        <FormField
          control={form.control}
          name="total_disbursed_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Disbursed Amount (₹)</FormLabel>
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

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="processing_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing Fee (₹)</FormLabel>
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

          <FormField
            control={form.control}
            name="other_charges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other Charges (₹)</FormLabel>
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

          <FormField
            control={form.control}
            name="loan_sanction_charges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sanction Charges (₹)</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenure_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenure (months)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Loan</FormLabel>
                <FormMessage />
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

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending 
            ? (loan ? "Updating Loan..." : "Creating Loan...") 
            : (loan ? "Update Loan" : "Create Loan")}
        </Button>
      </form>
    </Form>
  );
}
