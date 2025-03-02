import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Property {
  id: number;
  title: string;
}

interface Purchase {
  id: number;
  property_id: number;
  final_purchase_price: number;
  purchase_date: string;
}

export default function PurchasesPage() {
  const [, navigate] = useLocation();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const response = await fetch("/api/purchases");
      if (!response.ok) {
        throw new Error("Failed to fetch purchases");
      }
      return response.json() as Promise<Purchase[]>;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      return response.json() as Promise<Property[]>;
    },
  });

  // Function to get property title by id
  const getPropertyTitle = (propertyId: number): string => {
    const property = properties?.find((p) => p.id === propertyId);
    return property ? property.title : "Unknown Property";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">Loading...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Purchases</h1>
          <Button onClick={() => navigate("/properties")}>
            View Properties
          </Button>
        </div>

        {!purchases?.length ? (
          <div className="text-center py-12">
            <h2 className="text-xl">No purchases found</h2>
            <p className="text-muted-foreground mt-2">
              Go to properties and make your first purchase
            </p>
            <Button className="mt-4" onClick={() => navigate("/properties")}>
              Browse Properties
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchases?.map((purchase) => (
              <Card key={purchase.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => navigate(`/purchases/${purchase.id}`)}>
                <CardHeader>
                  <CardTitle>{getPropertyTitle(purchase.property_id)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">₹{Number(purchase.final_purchase_price).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    Purchased on {new Date(purchase.purchase_date).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/purchases/${purchase.id}`);
                          }}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}