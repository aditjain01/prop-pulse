import { useParams } from "wouter";
import { PurchaseDetail } from "@/components/details/purchase-detail";
import NotFound from "@/pages/not-found";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const purchaseId = id ? parseInt(id) : NaN;
  
  if (isNaN(purchaseId)) {
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
          <PurchaseDetail 
            purchaseId={purchaseId} 
            showHeader={true}
          />
        </div>

        <PurchaseDetail purchaseId={purchaseId} />
      </main>
    </div>
  );
} 