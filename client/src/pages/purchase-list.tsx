import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { type Purchase } from "@/lib/api/schemas";
import { Plus } from "lucide-react";
import { PurchaseList } from "@/components/lists/purchase-list";

export default function PurchaseListPage() {
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

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
          isLoading={purchasesLoading}
        />
      </main>
    </div>
  );
} 