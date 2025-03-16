import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { type Property } from "@/lib/schemas";

type PropertyListProps = {
  properties: Property[] | undefined;
  isLoading: boolean;
  onDeleteProperty?: (property: Property) => void;
};

export function PropertyList({ properties, isLoading, onDeleteProperty }: PropertyListProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Card key={property.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{property.name}</CardTitle>
            {onDeleteProperty && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onDeleteProperty(property)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
            <Link href={`/properties/${property.id}`}>
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