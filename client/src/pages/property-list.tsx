import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/property-form";
import { Plus, Trash2 } from "lucide-react";

export default function PropertyList() {
  const { toast } = useToast();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property deleted",
        description: "The property has been deleted successfully.",
      });
      setPropertyToDelete(null);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Properties</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            }
            title="Add Property"
          >
            <PropertyForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties?.length ? (
            properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{property.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setPropertyToDelete(property)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
                  <Link href={`/properties/${property.id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No properties found. Create your first property using the "Add Property" button.</p>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmation
        isOpen={!!propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={() => deleteMutation.mutate(propertyToDelete!.id)}
        title="Delete Property"
        description={`Are you sure you want to delete "${propertyToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
