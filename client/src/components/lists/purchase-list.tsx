import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { type Purchase, type Property } from "@/lib/schemas";

type PurchaseListProps = {
  purchases: Purchase[] | undefined;
  properties?: Property[] | undefined;
  isLoading: boolean;
  onDeletePurchase?: (purchase: Purchase) => void;
};

export function PurchaseList({ purchases, properties, isLoading, onDeletePurchase }: PurchaseListProps) {
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

  // Helper function to get property name
  const getPropertyName = (propertyId: number): string => {
    if (!properties) return "Unknown Property";
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : "Unknown Property";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {purchases.map((purchase) => (
        <Card key={purchase.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              {getPropertyName(purchase.property_id)}
            </CardTitle>
            {onDeletePurchase && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onDeletePurchase(purchase)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Purchase Date:</span>
                <span className="text-sm">{new Date(purchase.purchase_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Cost:</span>
                <span className="text-sm font-medium">₹{Number(purchase.total_cost).toLocaleString()}</span>
              </div>
              {purchase.seller && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Seller:</span>
                  <span className="text-sm">{purchase.seller}</span>
                </div>
              )}
            </div>
            <Link href={`/purchases/${purchase.id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 