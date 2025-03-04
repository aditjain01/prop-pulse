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
import { PropertyForm } from "@/components/forms/property-form";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/document-upload";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { type Property, type Purchase, type Document as PropertyDocument } from "@/lib/schemas";
import { PropertyDetail } from "@/components/details/property-detail";

export default function PropertyList() {
  const { toast } = useToast();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch selected property details
  const { data: selectedProperty } = useQuery<Property>({
    queryKey: [`/api/properties/${selectedPropertyId}`],
    enabled: !!selectedPropertyId,
  });

  // Fetch documents for selected property
  const { data: documents } = useQuery<PropertyDocument[]>({
    queryKey: [`/api/documents/property/${selectedPropertyId}`],
    enabled: !!selectedPropertyId,
  });

  // Fetch purchases for selected property
  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: [`/api/purchases`, { property_id: selectedPropertyId }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const res = await apiRequest("GET", `/api/purchases?property_id=${params.property_id}`);
      return res.json();
    },
    enabled: !!selectedPropertyId,
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

  // Function to view property details
  const handleViewDetails = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render property details when a property is selected
  if (selectedPropertyId && selectedProperty) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => setSelectedPropertyId(null)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
            <h1 className="text-3xl font-bold">{selectedProperty.name}</h1>
          </div>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Property Information</CardTitle>
                    <div className="flex space-x-2">
                      <SlideDialog
                        trigger={<Button variant="outline">Edit</Button>}
                        title="Edit Property"
                      >
                        <PropertyForm 
                          property={selectedProperty} 
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: [`/api/properties/${selectedPropertyId}`] });
                          }}
                        />
                      </SlideDialog>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => setPropertyToDelete(selectedProperty)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><span className="font-medium">Address:</span> {selectedProperty.address}</p>
                    <p><span className="font-medium">Type:</span> {selectedProperty.property_type}</p>
                    <p><span className="font-medium">Developer:</span> {selectedProperty.developer || 'Not specified'}</p>
                    <p><span className="font-medium">RERA ID:</span> {selectedProperty.rera_id || 'Not specified'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Area Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><span className="font-medium">Carpet Area:</span> {selectedProperty.carpet_area} sq.ft</p>
                    <p><span className="font-medium">Super Area:</span> {selectedProperty.super_area} sq.ft</p>
                    <p><span className="font-medium">Floor:</span> {selectedProperty.floor_number}</p>
                    <p><span className="font-medium">Current Rate:</span> ₹{Number(selectedProperty.current_rate).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Purchase History</CardTitle>
                  <SlideDialog
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Purchase
                      </Button>
                    }
                    title="Add Purchase"
                  >
                    <PurchaseForm propertyId={selectedPropertyId} />
                  </SlideDialog>
                </CardHeader>
                <CardContent>
                  {purchases && purchases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Date</th>
                            <th className="text-left py-2 px-4">Price</th>
                            <th className="text-left py-2 px-4">Seller</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.map((purchase) => (
                            <tr 
                              key={purchase.id} 
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="py-2 px-4">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                              <td className="py-2 px-4">₹{Number(purchase.total_cost).toLocaleString()}</td>
                              <td className="py-2 px-4">{purchase.seller || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No purchases recorded for this property.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUpload
                    entityType="property"
                    entityId={selectedPropertyId}
                    documents={documents || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Render property list
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
                    onClick={() => handleDelete(property)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleViewDetails(property.id)}
                  >
                    View Details
                  </Button>
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

      {/* Detail dialog */}
      {selectedPropertyId && (
        <SlideDialog
          trigger={<></>}
          title="Property Details"
          open={!!selectedPropertyId}
          onOpenChange={(open) => !open && setSelectedPropertyId(null)}
        >
          <PropertyDetail 
            propertyId={selectedPropertyId}
            onDelete={() => {
              setPropertyToDelete(properties?.find(p => p.id === selectedPropertyId) || null);
              setSelectedPropertyId(null);
            }}
            onClose={() => setSelectedPropertyId(null)}
          />
        </SlideDialog>
      )}

      {/* Delete confirmation */}
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
