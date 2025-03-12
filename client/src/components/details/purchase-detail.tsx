import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { DocumentUpload } from "@/components/document-upload";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type PurchaseDetailProps = {
  purchaseId: number;
  onEdit?: (purchase: any) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function PurchaseDetail({ purchaseId, onEdit, onDelete, onClose }: PurchaseDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: purchase, isLoading } = useQuery({
    queryKey: [`/api/purchases/${purchaseId}`],
  });

  // Fetch property details if available
  const { data: property } = useQuery({
    queryKey: [`/api/properties/${purchase?.property_id}`],
    enabled: !!purchase?.property_id,
  });

  if (!purchaseId) return null;

  const handleEdit = () => {
    if (onEdit && purchase) {
      onEdit(purchase);
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
        title={property?.name ? `Purchase: ${property.name}` : "Purchase Details"}
        onEdit={handleEdit}
        onDelete={onDelete || handleDelete}
        isLoading={isLoading}
      >
        {purchase && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                <p className="mt-1">{property?.name || "Loading..."}</p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Purchase Date</h3>
                <p className="mt-1">{formatDate(purchase.purchase_date)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Cost Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Base Cost</div>
                  <div>₹{purchase.base_cost?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Other Charges</div>
                  <div>₹{purchase.other_charges?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Stamp Duty</div>
                  <div>₹{purchase.stamp_duty?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Registration Charges</div>
                  <div>₹{purchase.registration_charges?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Legal Charges</div>
                  <div>₹{purchase.legal_charges?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">GST</div>
                  <div>₹{purchase.gst?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t mt-2">
                <div className="font-medium">Total Cost</div>
                <div className="font-bold">₹{purchase.total_cost?.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                <p className="mt-1">{formatDate(purchase.registration_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Possession Date</h3>
                <p className="mt-1">{formatDate(purchase.possession_date)}</p>
              </div>
            </div>

            {purchase.remarks && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Remarks</h3>
                <p className="mt-1 text-sm">{purchase.remarks}</p>
              </div>
            )}

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="documents">
                <AccordionTrigger>Documents</AccordionTrigger>
                <AccordionContent>
                  <DocumentUpload 
                    entityType="purchase" 
                    entityId={purchaseId} 
                    documents={purchase.documents || []} 
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
          title="Edit Purchase"
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <PurchaseForm 
            purchase={purchase} 
            onSuccess={() => setShowEditDialog(false)} 
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Purchase"
        description="Are you sure you want to delete this purchase? This action cannot be undone."
      />
    </>
  );
} 