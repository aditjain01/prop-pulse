import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api/api";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { Plus } from "lucide-react";
import { type Property } from "@/lib/schemas";
import { PropertyList } from "@/components/lists/property-list";

export default function PropertyListPage() {
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

  // Function to handle delete
  const handleDelete = (property: Property) => {
    setPropertyToDelete(property);
  };

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

        <PropertyList 
          properties={properties} 
          isLoading={isLoading} 
          onDeleteProperty={handleDelete}
        />

        {/* Delete confirmation */}
        <DeleteConfirmation
          isOpen={!!propertyToDelete}
          onClose={() => setPropertyToDelete(null)}
          onConfirm={() => deleteMutation.mutate(propertyToDelete!.id)}
          title="Delete Property"
          description={`Are you sure you want to delete "${propertyToDelete?.name}"? This action cannot be undone.`}
        />
      </main>
    </div>
  );
}
