import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PropertyForm } from "@/components/property-form";
import { Property } from "@shared/schema";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function PropertyList() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Properties</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <PropertyForm />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <Card className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{property.address}</p>
                  <p className="text-lg font-semibold">₹{Number(property.current_price).toLocaleString()}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm">{property.property_type}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm">{property.carpet_area} sq.ft</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
