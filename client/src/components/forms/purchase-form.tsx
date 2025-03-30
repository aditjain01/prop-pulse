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
import { useLocation } from "wouter";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { useState } from "react";
import { Plus } from "lucide-react";
import { 
  purchaseFormSchema, 
  type PurchaseFormValues, 
  type Purchase,
  type Property,
  initializePurchaseForm 
} from "@/lib/schemas";

type PurchaseFormProps = {
  propertyId?: number;
  purchase?: Purchase;
  onSuccess?: () => void;
};

export function PurchaseForm({ propertyId, purchase, onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  
  // Fetch properties for the dropdown
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: purchase 
      ? initializePurchaseForm(purchase)
      : initializePurchaseForm({ property_id: propertyId } as Purchase),
  });

  const mutation = useMutation({
    mutationFn: async (data: PurchaseFormValues) => {
      const endpoint = purchase ? `/api/purchases/${purchase.id}` : "/api/purchases";
      const method = purchase ? "PUT" : "POST";
      
      const payload = {
        ...data,
        property_id: parseInt(data.property_id),
      };
      
      const res = await apiRequest(method, endpoint, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/purchases`, { property_id: propertyId }] });
      }
      
      toast({
        title: purchase ? "Purchase updated" : "Purchase created",
        description: purchase 
          ? "The purchase has been updated successfully." 
          : "The purchase has been recorded successfully.",
      });
      
      if (onSuccess) onSuccess();
      if (!purchase) setLocation(`/purchases/${data.id}`);
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
        {/* Property Selection Field */}
        <FormField
          control={form.control}
          name="property_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <div className="flex space-x-2">
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!!propertyId}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!propertyId && (
                  <SlideDialog
                    trigger={
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                    title="Add Property"
                    open={showPropertyForm}
                    onOpenChange={setShowPropertyForm}
                  >
                    <PropertyForm 
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
                        setShowPropertyForm(false);
                      }} 
                    />
                  </SlideDialog>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="base_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Cost (₹)</FormLabel>
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
          name="ifms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IFMS (₹)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lease_rent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lease Rent (₹)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AMC (₹)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gst"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST (₹)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
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
              <FormLabel>Registration Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
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
              <FormLabel>Possession Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seller"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller Information</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending 
            ? (purchase ? "Updating Purchase..." : "Creating Purchase...") 
            : (purchase ? "Update Purchase" : "Create Purchase")}
        </Button>
      </form>
    </Form>
  );
}