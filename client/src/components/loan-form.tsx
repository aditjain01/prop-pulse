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
import { z } from "zod";
import { useParams } from "wouter";

type LoanFormProps = {
  loan?: any;
  purchaseId?: number;  // Optional purchase ID if coming from purchase detail
  onSuccess?: () => void;
};

const loanSchema = z.object({
  purchase_id: z.string().nonempty("Purchase is required"),
  name: z.string().nonempty("Name is required"),
  institution: z.string().nonempty("Institution is required"),
  agent: z.string().optional(),
  sanction_date: z.string().nonempty("Sanction date is required"),
  sanction_amount: z.string().nonempty("Sanction amount is required"),
  processing_fee: z.string().default("0"),
  other_charges: z.string().default("0"),
  loan_sanction_charges: z.string().default("0"),
  interest_rate: z.string().nonempty("Interest rate is required"),
  tenure_months: z.string().nonempty("Tenure is required"),
  is_active: z.boolean().default(true),
});

export function LoanForm({ loan, purchaseId, onSuccess }: LoanFormProps) {
  const { toast } = useToast();
  
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
  
  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: loan ? {
      ...loan,
      purchase_id: loan.purchase_id?.toString() || "",
      sanction_date: loan.sanction_date ? new Date(loan.sanction_date).toISOString().split('T')[0] : "",
      sanction_amount: loan.sanction_amount?.toString() || "0",
      processing_fee: loan.processing_fee?.toString() || "0",
      other_charges: loan.other_charges?.toString() || "0",
      loan_sanction_charges: loan.loan_sanction_charges?.toString() || "0",
      interest_rate: loan.interest_rate?.toString() || "0",
      tenure_months: loan.tenure_months?.toString() || "0",
    } : {
      purchase_id: purchaseId?.toString() || "",
      name: "",
      institution: "",
      agent: "",
      sanction_date: new Date().toISOString().split('T')[0],
      sanction_amount: "0",
      processing_fee: "0",
      other_charges: "0",
      loan_sanction_charges: "0",
      interest_rate: "0",
      tenure_months: "0",
      is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = loan ? `/api/loans/${loan.id}` : "/api/loans";
      const method = loan ? "PUT" : "POST";
      
      // Parse numeric values
      const parsedData = {
        ...data,
        purchase_id: parseInt(data.purchase_id),
        sanction_amount: parseFloat(data.sanction_amount),
        processing_fee: parseFloat(data.processing_fee),
        other_charges: parseFloat(data.other_charges),
        loan_sanction_charges: parseFloat(data.loan_sanction_charges),
        interest_rate: parseFloat(data.interest_rate),
        tenure_months: parseInt(data.tenure_months),
      };
      
      const res = await apiRequest(method, endpoint, parsedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      
      toast({
        title: loan ? "Loan updated" : "Loan created",
        description: "The loan has been saved successfully.",
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
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!purchaseId || !!loan}  // Disable if purchaseId is provided or editing existing loan
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a purchase" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {purchasesLoading ? (
                    <SelectItem value="loading" disabled>Loading purchases...</SelectItem>
                  ) : purchases?.length ? (
                    purchases.map((purchase) => (
                      <SelectItem key={purchase.id} value={purchase.id.toString()}>
                        {getPropertyName(purchase.id)} - ₹{Number(purchase.base_cost || purchase.amount || 0).toLocaleString()}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No purchases available</SelectItem>
                  )}
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
                <Input {...field} placeholder="e.g., Home Loan for Property X" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., HDFC Bank" />
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
                <FormLabel>Agent/RM</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  <Input type="number" step="0.01" {...field} />
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
                  <Input type="number" {...field} />
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending 
            ? (loan ? "Updating..." : "Creating...") 
            : (loan ? "Update Loan" : "Create Loan")}
        </Button>
      </form>
    </Form>
  );
}
