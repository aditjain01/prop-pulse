import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

type PropertyFormProps = {
  property?: any;
  onSuccess?: () => void;
};

const propertySchema = z.object({
  name: z.string().nonempty("Name is required"),
  address: z.string().nonempty("Address is required"),
  property_type: z.string().nonempty("Property type is required"),
  carpet_area: z.string().nonempty("Carpet area is required"),
  exclusive_area: z.string().nonempty("Exclusive area is required"),
  common_area: z.string().nonempty("Common area is required"),
  floor_number: z.string().nonempty("Floor number is required"),
  amenities: z.array(z.string()).default([]),
  initial_rate: z.string().nonempty("Initial rate is required"),
  current_rate: z.string().nonempty("Current rate is required"),
  developer: z.string().optional(),
  rera_id: z.string().optional(),
});

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? {
      ...property,
      carpet_area: property.carpet_area?.toString() || "0",
      exclusive_area: property.exclusive_area?.toString() || "0",
      common_area: property.common_area?.toString() || "0",
      floor_number: property.floor_number?.toString() || "0",
      initial_rate: property.initial_rate?.toString() || "0",
      current_rate: property.current_rate?.toString() || "0",
    } : {
      name: "",
      address: "",
      property_type: "",
      carpet_area: "0",
      exclusive_area: "0",
      common_area: "0",
      floor_number: "0",
      amenities: [],
      initial_rate: "0",
      current_rate: "0",
      developer: "",
      rera_id: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting property data:", data);
      console.log("Is update operation:", !!property);
      
      // Parse numeric fields
      const parsedData = {
        ...data,
        carpet_area: parseFloat(data.carpet_area),
        exclusive_area: parseFloat(data.exclusive_area),
        common_area: parseFloat(data.common_area),
        floor_number: parseInt(data.floor_number),
        initial_rate: parseFloat(data.initial_rate),
        current_rate: parseFloat(data.current_rate),
      };
      
      // Determine if this is a create or update operation
      const endpoint = property 
        ? `/api/properties/${property.id}` 
        : "/api/properties";
      
      const method = property ? "PUT" : "POST";
      
      console.log(`Making ${method} request to ${endpoint}`);
      
      const res = await apiRequest(method, endpoint, parsedData);
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
                  <Input type="number" {...field} />
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
            name="common_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Common Area (sq.ft)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
            name="initial_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Rate (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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