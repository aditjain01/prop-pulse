import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { type Property } from "@/lib/schemas";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";

type PropertyListProps = {
  properties: Property[] | undefined;
  isLoading: boolean;
};

export function PropertyList({ properties, isLoading }: PropertyListProps) {
  const { toast } = useToast();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/properties"] });
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
    return <div className="flex justify-center items-center py-10">Loading properties...</div>;
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No properties found. Create your first property using the "Add Property" button.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div key={property.id} className="relative">
            <Link href={`/properties/${property.id}`} className="block">
              <Card className="overflow-hidden hover:border-primary transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{property.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setPropertyToDelete(property);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-muted-foreground">{property.address}</p>
                    {property.developer && <p className="text-muted-foreground">Developer: {property.developer}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <DeleteConfirmation
        isOpen={!!propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={() => deleteMutation.mutate(propertyToDelete!.id)}
        title="Delete Property"
        description={`Are you sure you want to delete "${propertyToDelete?.name}"? This action cannot be undone.`}
      />
    </>
  );
} 