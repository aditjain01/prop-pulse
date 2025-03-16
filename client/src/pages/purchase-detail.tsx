import { useParams } from "wouter";
import { PurchaseDetail } from "@/components/details/purchase-detail";
import NotFound from "@/pages/not-found";
import { NavBar } from "@/components/nav-bar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { type Purchase, type Property } from "@/lib/schemas";

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const purchaseId = id ? parseInt(id) : NaN;
  
  if (isNaN(purchaseId)) {
    return <NotFound message="Purchase doesn't exist" />;
  }
  
  // Fetch purchase and property details for the header
  const { data: purchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${purchaseId}`],
  });

  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${purchase?.property_id}`],
    enabled: !!purchase?.property_id,
  });
  
  if (purchaseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div>Loading purchase details...</div>
        </main>
      </div>
    );
  }
  
  if (!purchase) {
    return <NotFound message="Purchase doesn't exist" />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href="/purchases">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Purchases
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {property ? property.name : `Purchase #${purchase.id}`}
          </h1>
        </div>

        <PurchaseDetail purchaseId={purchaseId} />
      </main>
    </div>
  );
} 