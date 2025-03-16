import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { type Purchase, type Property } from "@/lib/schemas";
import { Plus } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { PurchaseList } from "@/components/lists/purchase-list";

export default function PurchaseListPage() {
  const { toast } = useToast();
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
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

  // Function to handle delete
  const handleDelete = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
  };

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

        <PurchaseList 
          purchases={purchases} 
          properties={properties}
          isLoading={purchasesLoading} 
          onDeletePurchase={handleDelete}
        />

        {/* Delete confirmation */}
        <DeleteConfirmation
          isOpen={!!purchaseToDelete}
          onClose={() => setPurchaseToDelete(null)}
          onConfirm={() => deleteMutation.mutate(purchaseToDelete!.id)}
          title="Delete Purchase"
          description={`Are you sure you want to delete this purchase? This action cannot be undone.`}
        />
      </main>
    </div>
  );
} 