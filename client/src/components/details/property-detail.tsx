import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { apiRequest } from "@/lib/api/api";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { type Property, type Purchase, type Document as PropertyDocument } from "@/lib/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
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
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

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

  // Delete purchase mutation
  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/purchases/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/purchases`, { property_id: propertyId }] });
      toast({
        title: "Purchase deleted",
        description: "The purchase has been deleted successfully.",
      });
      setPurchaseToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const handleDeletePurchase = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
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
          <DetailView
            title={property?.name || "Property Details"}
            onEdit={handleEdit}
            onDelete={onDelete || handleDelete}
            isLoading={propertyLoading}
          >
            {property && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                    <p className="mt-1">{property.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property Type</h3>
                    <p className="mt-1">{property.property_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Carpet Area</h3>
                    <p className="mt-1">{property.carpet_area} sq.ft</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Exclusive Area</h3>
                    <p className="mt-1">{property.exclusive_area} sq.ft</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Common Area</h3>
                    <p className="mt-1">{property.common_area} sq.ft</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Floor Number</h3>
                    <p className="mt-1">{property.floor_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Initial Rate</h3>
                    <p className="mt-1">₹{property.initial_rate}/sq.ft</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Rate</h3>
                    <p className="mt-1">₹{property.current_rate}/sq.ft</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
                    <p className="mt-1">{property.developer || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">RERA ID</h3>
                    <p className="mt-1">{property.rera_id || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </DetailView>
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
                  onSuccess={handlePurchaseFormSuccess}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <PurchaseList
                purchases={purchases}
                isLoading={purchasesLoading}
                onDeletePurchase={handleDeletePurchase}
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

      {showEditDialog && (
        <SlideDialog
          trigger={<></>}
          title="Edit Property"
        >
          <PropertyForm 
            property={property} 
            onSuccess={handleEditSuccess} 
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action cannot be undone."
      />

      {/* Purchase delete confirmation */}
      {purchaseToDelete && (
        <DeleteConfirmation
          isOpen={!!purchaseToDelete}
          onClose={() => setPurchaseToDelete(null)}
          onConfirm={() => deletePurchaseMutation.mutate(purchaseToDelete.id)}
          title="Delete Purchase"
          description={`Are you sure you want to delete this purchase? This action cannot be undone.`}
        />
      )}
    </>
  );
} 