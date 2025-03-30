import { useQuery } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { apiRequest } from "@/lib/api/api";
import { SlideDialog } from "@/components/slide-dialog";
import { PropertyForm } from "@/components/forms/property-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { DocumentUpload } from "@/components/document-upload";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { type Property } from "@/lib/schemas";

type PropertyDetailProps = {
  propertyId: number;
  onEdit?: (property: Property) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function PropertyDetail({ propertyId, onEdit, onDelete, onClose }: PropertyDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
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

  return (
    <>
      <DetailView
        title={property?.name || "Property Details"}
        onEdit={handleEdit}
        onDelete={onDelete || handleDelete}
        isLoading={isLoading}
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

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="documents">
                <AccordionTrigger>Documents</AccordionTrigger>
                <AccordionContent>
                  <DocumentUpload 
                    entityType="property" 
                    entityId={propertyId} 
                    documents={property.documents || []} 
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </DetailView>

      {showEditDialog && (
        <SlideDialog
          trigger={<></>}
          title="Edit Property"
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <PropertyForm 
            property={property} 
            onSuccess={() => setShowEditDialog(false)} 
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
    </>
  );
} 