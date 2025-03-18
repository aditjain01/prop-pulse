import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { apiRequest } from "@/lib/api/base";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { type Property, type Purchase, type Document as PropertyDocument } from "@/lib/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { DocumentUpload } from "@/components/document-upload";
import { PurchaseList } from "@/components/lists/purchase-list";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PropertyDetailProps = {
  propertyId: number;
  showHeader?: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function PropertyDetail({ propertyId, showHeader = false, onEdit, onDelete, onClose }: PropertyDetailProps) {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch property details
  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  // Fetch purchases for the property
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: [`/api/purchases`, { property_id: propertyId }],
    enabled: !!propertyId,
  });
  
  // Fetch documents for this property
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PropertyDocument[]>({
    queryKey: [`/api/documents`, { entity_type: "property", entity_id: propertyId }],
    enabled: !!propertyId,
  });

  if (!propertyId) return null;

  const handleEdit = () => {
    if (onEdit && property) {
      onEdit(property);
    } else {
      setShowEditDialog(true);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
  };

  const handlePurchaseFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/purchases`, { property_id: propertyId }] });
  };

  // If we're just showing the header (property name), return that
  if (showHeader) {
    if (propertyLoading) {
      return <div>Loading...</div>;
    }
    
    if (!property) {
      return <div>Property not found</div>;
    }
    
    return <h1 className="text-3xl font-bold">{property.name}</h1>;
  }

  return (
    <>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {property?.name || "Property Details"}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {property?.developer || ""}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <SlideDialog
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={propertyLoading}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Property
                      </Button>
                    }
                    title="Edit Property"
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                  >
                    <PropertyForm 
                      property={property} 
                      onSuccess={handleEditSuccess} 
                    />
                  </SlideDialog>
                  {onDelete || handleDelete ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onDelete || handleDelete}
                      disabled={propertyLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {propertyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : property ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                      <p className="mt-1">{property.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Property Type</h3>
                      <p className="mt-1">{property.property_type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">RERA ID</h3>
                      <p className="mt-1">{property.rera_id || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Carpet Area</h3>
                      <p className="mt-1">{property.carpet_area ? `${property.carpet_area} sq.ft` : "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Exclusive Area</h3>
                      <p className="mt-1">{property.exclusive_area ? `${property.exclusive_area} sq.ft` : "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Common Area</h3>
                      <p className="mt-1">{property.common_area ? `${property.common_area} sq.ft` : "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Floor Number</h3>
                      <p className="mt-1">{property.floor_number || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Initial Rate</h3>
                      <p className="mt-1">{property.initial_rate ? `₹${property.initial_rate}/sq.ft` : "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Current Rate</h3>
                      <p className="mt-1">{property.current_rate ? `₹${property.current_rate}/sq.ft` : "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
                      <p className="mt-1">{property.developer || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Parking Details</h3>
                      <p className="mt-1">{property.parking_details || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Amenities</h3>
                      <p className="mt-1">
                        {property.amenities && property.amenities.length > 0 
                          ? property.amenities.join(", ") 
                          : "None"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Property not found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
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
                <PurchaseForm 
                  propertyId={propertyId} 
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <PurchaseList
                purchases={purchases}
                isLoading={purchasesLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Property Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div>Loading documents...</div>
              ) : (
                <DocumentUpload 
                  entityType="property" 
                  entityId={propertyId} 
                  documents={documents as any} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action cannot be undone."
      />
    </>
  );
} 