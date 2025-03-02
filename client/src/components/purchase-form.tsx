import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";

// Form schema for purchase creation
const purchaseSchema = z.object({
  property_id: z.number(),
  purchase_date: z.string(),
  final_purchase_price: z.string().min(1, "Price is required"),
  registration_date: z.string().nullable(),
  possession_date: z.string().nullable(),
  seller_info: z.string().nullable(),
  remarks: z.string().nullable(),
  cost_breakdown: z.string().default("{}"),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

type PurchaseFormProps = {
  propertyId: number;
  onSuccess?: () => void;
};

export function PurchaseForm({ propertyId, onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      property_id: propertyId,
      purchase_date: new Date().toISOString().split('T')[0],
      final_purchase_price: "",
      cost_breakdown: "{}",
      seller_info: "",
      remarks: "",
      registration_date: "",
      possession_date: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PurchaseFormValues) => {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          final_purchase_price: parseFloat(data.final_purchase_price),
          cost_breakdown: JSON.parse(data.cost_breakdown || "{}"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create purchase");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({
        title: "Purchase created",
        description: "The purchase has been recorded successfully.",
      });
      if (onSuccess) onSuccess();
      navigate(`/purchases/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: PurchaseFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="final_purchase_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Final Purchase Price</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter price" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registration_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Date (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="possession_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possession Date (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seller_info"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller Information</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter seller details"
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating Purchase..." : "Create Purchase"}
        </Button>
      </form>
    </Form>
  );
}