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
import { useLocation } from "wouter";
import { Property } from "shared/schema";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PropertyForm } from "@/components/property-form";
import { useState } from "react";
import { Plus } from "lucide-react";

type PurchaseFormProps = {
  propertyId?: number;
  onSuccess?: () => void;
};

export function PurchaseForm({ propertyId, onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  
  // Fetch properties for the dropdown
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm({
    defaultValues: {
      property_id: propertyId?.toString() || "",
      purchase_date: new Date().toISOString().split('T')[0],
      base_cost: "0",
      other_charges: "0",
      ifms: "0",
      lease_rent: "0",
      amc: "0",
      gst: "0",
      seller: "",
      remarks: "",
      registration_date: null,
      possession_date: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/purchases", {
        ...data,
        property_id: parseInt(data.property_id),
        base_cost: parseFloat(data.base_cost),
        other_charges: parseFloat(data.other_charges),
        ifms: parseFloat(data.ifms),
        lease_rent: parseFloat(data.lease_rent),
        amc: parseFloat(data.amc),
        gst: parseFloat(data.gst),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({
        title: "Purchase created",
        description: "The purchase has been recorded successfully.",
      });
      if (onSuccess) onSuccess();
      setLocation(`/purchases/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePropertyCreated = () => {
    setPropertyDialogOpen(false);
    // Refresh the properties list
    queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
  };

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
                <div className="flex-1">
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                </div>
                <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <PropertyForm onSuccess={handlePropertyCreated} />
                  </DialogContent>
                </Dialog>
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
          {mutation.isPending ? "Creating Purchase..." : "Create Purchase"}
        </Button>
      </form>
    </Form>
  );
}