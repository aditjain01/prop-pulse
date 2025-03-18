import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { Plus } from "lucide-react";
import { type Property } from "@/lib/schemas";
import { PropertyList } from "@/components/lists/property-list";

export default function PropertyListPage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/v2/properties"],
  });

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
        />
      </main>
    </div>
  );
}
