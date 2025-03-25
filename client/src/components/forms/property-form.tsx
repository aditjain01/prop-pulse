import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api/base";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  propertyFormSchema, 
  type PropertyFormValues, 
  type Property,
  initializePropertyForm 
} from "@/lib/api/schemas";

type PropertyFormProps = {
  property?: Property;
  onSuccess?: () => void;
};

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { toast } = useToast();
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initializePropertyForm(property),
  });

  const mutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      // Determine if this is a create or update operation
      const endpoint = property 
        ? `/api/properties/${property.id}` 
        : "/api/properties";
      
      const method = property ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      if (property) {
        queryClient.invalidateQueries({ queryKey: [`/api/properties/${property.id}`] });
      }
      
      toast({
        title: property ? "Property updated" : "Property created",
        description: "The property has been saved successfully.",
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      console.error("Error saving property:", error);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="property_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="plot">Plot</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carpet_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carpet Area (sq.ft)</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exclusive_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exclusive Area (sq.ft)</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="common_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Common Area (sq.ft)</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floor_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor Number</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initial_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Rate (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Rate (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field as any} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="developer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Developer</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rera_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RERA ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending 
            ? (property ? "Updating..." : "Creating...") 
            : (property ? "Update Property" : "Create Property")}
        </Button>
      </form>
    </Form>
  );
}