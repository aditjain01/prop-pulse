import { useQuery } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Badge } from "@/components/ui/badge";

type PaymentSourceDetailProps = {
  paymentSourceId: number;
  onEdit?: (paymentSource: any) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function PaymentSourceDetail({ 
  paymentSourceId, 
  onEdit, 
  onDelete, 
  onClose 
}: PaymentSourceDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: paymentSource, isLoading } = useQuery({
    queryKey: [`/api/payment-sources/${paymentSourceId}`],
  });

  // Fetch loan if source type is loan
  const { data: loan } = useQuery({
    queryKey: [`/api/loans/${paymentSource?.loan_id}`],
    enabled: !!paymentSource?.loan_id && paymentSource.source_type === "loan",
  });

  if (!paymentSourceId) return null;

  const handleEdit = () => {
    if (onEdit && paymentSource) {
      onEdit(paymentSource);
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
        title={paymentSource?.name || "Payment Source Details"}
        onEdit={handleEdit}
        onDelete={onDelete || handleDelete}
        isLoading={isLoading}
      >
        {paymentSource && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                <div className="mt-1">
                  <Badge>
                    {paymentSource.source_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Default Source</h3>
                <div className="mt-1">
                  {paymentSource.default_source ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {loan && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Loan</h3>
                <p className="mt-1">{loan.name}</p>
              </div>
            )}
          </div>
        )}
      </DetailView>

      {showEditDialog && (
        <SlideDialog
          trigger={<></>}
          title="Edit Payment Source"
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <PaymentSourceForm 
            paymentSource={paymentSource} 
            onSuccess={() => setShowEditDialog(false)} 
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Payment Source"
        description="Are you sure you want to delete this payment source? This action cannot be undone."
      />
    </>
  );
} 