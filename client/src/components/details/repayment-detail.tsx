import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { DocumentUpload } from "@/components/document-upload";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/api/base";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type LoanRepayment } from "@/lib/api/schemas";

type RepaymentDetailProps = {
  repaymentId: number;
  onEdit?: (repayment: LoanRepayment) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function RepaymentDetail({ repaymentId, onEdit, onDelete, onClose }: RepaymentDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: repayment, isLoading } = useQuery<LoanRepayment>({
    queryKey: [`/api/repayments/${repaymentId}`],
  });

  // Fetch documents for this repayment
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: [`/api/documents`, { entity_type: "repayment", entity_id: repaymentId }],
    enabled: !!repaymentId,
  });

  if (!repaymentId) return null;

  const handleEdit = () => {
    if (onEdit && repayment) {
      onEdit(repayment);
    } else {
      setShowEditDialog(true);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/repayments/${repaymentId}`] });
    setShowEditDialog(false);
  };

  // Delete repayment mutation
  const deleteRepaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/repayments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      toast({
        title: "Repayment deleted",
        description: "The repayment has been deleted successfully.",
      });
      if (onDelete) {
        onDelete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      deleteRepaymentMutation.mutate(repaymentId);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DetailView
        title={`Repayment: ${formatDate(repayment?.payment_date)}`}
        onEdit={handleEdit}
        onDelete={onDelete || handleDelete}
        isLoading={isLoading}
      >
        {repayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Loan</h3>
                <p className="mt-1">{repayment.loan_name || "Unknown"}</p>
                {repayment.loan_institution && (
                  <p className="text-xs text-muted-foreground">
                    {repayment.loan_institution}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                <p className="mt-1">{formatDate(repayment.payment_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                <p className="mt-1">{repayment.property_name || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Payment</h3>
                <p className="mt-1 font-semibold">{formatCurrency(repayment.total_payment)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Breakdown</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Principal</div>
                  <div>{formatCurrency(repayment.principal_amount)}</div>
                </div>
                <div>
                  <div className="font-medium">Interest</div>
                  <div>{formatCurrency(repayment.interest_amount)}</div>
                </div>
                <div>
                  <div className="font-medium">Other Fees</div>
                  <div>{formatCurrency(repayment.other_fees)}</div>
                </div>
                <div>
                  <div className="font-medium">Penalties</div>
                  <div>{formatCurrency(repayment.penalties)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Mode</h3>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {repayment.payment_mode}
                  </Badge>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Source</h3>
                <p className="mt-1">{repayment.source_name || "N/A"}</p>
              </div>
            </div>

            {repayment.transaction_reference && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transaction Reference</h3>
                <p className="mt-1">{repayment.transaction_reference}</p>
              </div>
            )}

            {repayment.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="mt-1 text-sm">{repayment.notes}</p>
              </div>
            )}

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="documents">
                <AccordionTrigger>Documents</AccordionTrigger>
                <AccordionContent>
                  <DocumentUpload 
                    entityType="repayment" 
                    entityId={repaymentId} 
                    documents={documents || []} 
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
          title="Edit Repayment"
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        >
          <LoanRepaymentForm 
            repayment={repayment}
            onSuccess={handleEditSuccess}
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Repayment"
        description="Are you sure you want to delete this repayment? This action cannot be undone."
      />
    </>
  );
} 