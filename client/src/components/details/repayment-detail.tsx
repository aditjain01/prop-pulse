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
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RepaymentDetailProps = {
  repaymentId: number;
  onEdit?: (repayment: any) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function RepaymentDetail({ repaymentId, onEdit, onDelete, onClose }: RepaymentDetailProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: repayment, isLoading } = useQuery({
    queryKey: [`/api/repayments/${repaymentId}`],
  });

  // Fetch loan details
  const { data: loan } = useQuery({
    queryKey: [`/api/loans/${repayment?.loan_id}`],
    enabled: !!repayment?.loan_id,
  });

  // Fetch payment source
  const { data: paymentSource } = useQuery({
    queryKey: [`/api/payment-sources/${repayment?.source_id}`],
    enabled: !!repayment?.source_id,
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

  const totalAmount = repayment 
    ? (repayment.principal_amount || 0) + 
      (repayment.interest_amount || 0) + 
      (repayment.other_fees || 0)
    : 0;

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
                <p className="mt-1">{loan?.name || "Loading..."}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Date</h3>
                <p className="mt-1">{formatDate(repayment.payment_date)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Principal</div>
                  <div>₹{repayment.principal_amount?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Interest</div>
                  <div>₹{repayment.interest_amount?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Other Fees</div>
                  <div>₹{repayment.other_fees?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t mt-2">
                <div className="font-medium">Total Amount</div>
                <div className="font-bold">₹{totalAmount.toLocaleString()}</div>
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
                <p className="mt-1">{paymentSource?.name || "N/A"}</p>
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
                    documents={repayment.documents || []} 
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
            onSuccess={() => setShowEditDialog(false)} 
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete || (() => {})}
        title="Delete Repayment"
        description="Are you sure you want to delete this repayment? This action cannot be undone."
      />
    </>
  );
} 