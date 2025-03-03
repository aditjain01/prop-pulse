import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/purchase-form";
import { Purchase, Property } from "shared/schema";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";

export default function PurchaseList() {
  const { toast } = useToast();
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Find property details for each purchase
  const purchasesWithProperties = purchases?.map(purchase => {
    const property = properties?.find(p => p.id === purchase.property_id);
    return { ...purchase, property };
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/purchases/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({
        title: "Purchase deleted",
        description: "The purchase has been deleted successfully.",
      });
      setPurchaseToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (purchasesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Purchases</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Purchase
              </Button>
            }
            title="Add Purchase"
          >
            <PurchaseForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {purchasesWithProperties?.length ? (
            purchasesWithProperties.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {purchase.property?.name || "Unknown Property"}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setPurchaseToDelete(purchase)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Purchase Date: {new Date(purchase.purchase_date).toLocaleDateString()}
                  </p>
                  <p className="font-medium mb-4">
                    ₹{Number(purchase.base_cost).toLocaleString()}
                  </p>
                  <Link href={`/purchases/${purchase.id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No purchases found. Create your first purchase using the "Add Purchase" button.</p>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmation
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => deleteMutation.mutate(purchaseToDelete!.id)}
        title="Delete Purchase"
        description={`Are you sure you want to delete the purchase for "${purchaseToDelete?.property?.name || 'this property'}"? This action cannot be undone.`}
      />
    </div>
  );
} 