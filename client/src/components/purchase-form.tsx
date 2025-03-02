import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertPurchaseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";

type PurchaseFormProps = {
  propertyId: number;
  onSuccess?: () => void;
};

export function PurchaseForm({ propertyId, onSuccess }: PurchaseFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertPurchaseSchema),
    defaultValues: {
      property_id: propertyId,
      purchase_date: new Date().toISOString().split('T')[0],
      final_purchase_price: "0",
      cost_breakdown: "{}",
      seller_info: "",
      remarks: "",
      registration_date: null,
      possession_date: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/purchases", {
        ...data,
        cost_breakdown: JSON.parse(data.cost_breakdown || "{}"),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
              <FormLabel>Final Purchase Price (₹)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost_breakdown"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Breakdown (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder='{"base_price": "1000000", "registration": "50000", "stamp_duty": "30000"}'
                  rows={4}
                />
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
          name="seller_info"
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
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useLocation } from "wouter";

// Form schema based on your PurchaseCreate schema
const formSchema = z.object({
  property_id: z.number(),
  purchase_date: z.string(),
  registration_date: z.string().optional(),
  possession_date: z.string().optional(),
  final_purchase_price: z.string(), // Will be converted to Decimal
  cost_breakdown: z.record(z.any()),
  seller_info: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PurchaseForm({ propertyId }: { propertyId: number }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_id: propertyId,
      purchase_date: new Date().toISOString().split('T')[0],
      final_purchase_price: '',
      cost_breakdown: { "base_price": 0 },
      seller_info: '',
      remarks: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          final_purchase_price: parseFloat(values.final_purchase_price),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create purchase");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      navigate("/purchases");
    },
  });

  function onSubmit(values: FormValues) {
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
                <Input type="date" {...field} />
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
                <Input type="date" {...field} />
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
