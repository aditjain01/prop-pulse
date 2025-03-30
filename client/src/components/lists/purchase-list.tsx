import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus } from "lucide-react";
import { type Purchase } from "@/lib/api/schemas";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "../slide-dialog";
import { PurchaseForm } from "../forms/purchase-form";

type PurchaseListProps = {
  purchases: Purchase[] | undefined;
  isLoading: boolean;
};

export function PurchaseList({ purchases, isLoading }: PurchaseListProps) {
  const { toast } = useToast();
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  
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

  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading purchases...</div>;
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No purchases found. Create your first purchase using the "Add Purchase" button.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="relative">
            <Link href={`/purchases/${purchase.id}`} className="block">
              <Card className="overflow-hidden hover:border-primary transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                  {(purchase as any).property_name || "Unknown Property"}
                </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setPurchaseToDelete(purchase);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Date:</span>
                    <span className="text-sm">{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cost:</span>
                    <span className="text-sm font-medium">₹{Number((purchase as any).total_purchase_cost || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Delete confirmation */}
      <DeleteConfirmation
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => deleteMutation.mutate(purchaseToDelete!.id)}
        title="Delete Purchase"
        description={`Are you sure you want to delete this purchase? This action cannot be undone.`}
      />
    </>
  );
} 