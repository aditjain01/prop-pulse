import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { DocumentUpload } from "@/components/document-upload";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, Receipt, Plus } from "lucide-react";
import { LoanForm } from "@/components/forms/loan-form";
import { type Purchase, type Property, type Document as PurchaseDocument, type Loan, type Invoice, type Payment } from "@/lib/schemas";
import { AcquisitionCostCard } from "@/components/acquisition-cost";
import { Badge } from "@/components/ui/badge";
import { LoanList } from "@/components/lists/loan-list";
import { InvoiceList } from "@/components/lists/invoice-list";
import { PaymentList } from "@/components/lists/payment-list";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type PurchaseDetailProps = {
  purchaseId: number;
  onEdit?: (purchase: Purchase) => void;
  onDelete?: () => void;
  onClose?: () => void;
};

export function PurchaseDetail({ purchaseId, onEdit, onDelete, onClose }: PurchaseDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  // Fetch purchase details
  const { data: purchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${purchaseId}`],
  });

  // Fetch property details if available
  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${purchase?.property_id}`],
    enabled: !!purchase?.property_id,
  });

  // Fetch documents for this purchase
  const { data: documents = [], isLoading: documentsLoading } = useQuery<PurchaseDocument[]>({
    queryKey: [`/api/documents`, { entity_type: "purchase", entity_id: purchaseId }],
    enabled: !!purchaseId,
  });

  // Fetch loans for this purchase
  const { data: loans = [], isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans", { purchase_id: purchaseId }],
    enabled: !!purchaseId,
  });

  // Fetch invoices for this purchase
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", { purchase_id: purchaseId }],
    enabled: !!purchaseId,
  });

  // Fetch payments for this purchase
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", { purchase_id: purchaseId }],
    enabled: !!purchaseId,
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", { purchase_id: purchaseId }] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      setLoanToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", { purchase_id: purchaseId }] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", { purchase_id: purchaseId }] });
      toast({
        title: "Payment deleted",
        description: "The payment has been deleted successfully.",
      });
      setPaymentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const handleEditSuccess = () => {
    setShowEditDialog(false);
  };

  const handleDeleteLoan = (loan: Loan) => {
    setLoanToDelete(loan);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
  };

  const handleEditPayment = (payment: Payment) => {
    setPaymentToEdit(payment);
  };

  const handleLoanFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/loans", { purchase_id: purchaseId }] });
  };

  const handleInvoiceFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", { purchase_id: purchaseId }] });
    setInvoiceToEdit(null);
  };

  const handlePaymentFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/payments", { purchase_id: purchaseId }] });
    setPaymentToEdit(null);
  };

  return (
    <>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailView
            title={property?.name ? `Purchase: ${property.name}` : "Purchase Details"}
            onEdit={handleEdit}
            onDelete={onDelete || handleDelete}
            isLoading={purchaseLoading}
          >
            {purchase && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Purchase Date</h3>
                    <p className="mt-1">{formatDate(purchase.purchase_date)}</p>
                  </div>
                </div>

                <AcquisitionCostCard purchaseId={purchase.id} purchase={purchase} />

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
              </div>
            )}
          </DetailView>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Loans</CardTitle>
              <SlideDialog
                trigger={
                  <Button>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Loan
                  </Button>
                }
                title="Add Loan"
              >
                <LoanForm 
                  purchaseId={purchaseId}
                  onSuccess={handleLoanFormSuccess}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <LoanList
                loans={loans}
                isLoading={loansLoading}
                onDeleteLoan={handleDeleteLoan}
                onViewLoan={(loanId) => navigate(`/loans/${loanId}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Invoices</CardTitle>
              <SlideDialog
                trigger={
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Add Invoice
                  </Button>
                }
                title="Add Invoice"
              >
                <InvoiceForm 
                  purchaseId={purchaseId}
                  onSuccess={handleInvoiceFormSuccess}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <InvoiceList
                invoices={invoices}
                isLoading={invoicesLoading}
                onDeleteInvoice={handleDeleteInvoice}
                onEditInvoice={handleEditInvoice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Payments</CardTitle>
              <SlideDialog
                trigger={
                  <Button>
                    <Receipt className="mr-2 h-4 w-4" />
                    Add Payment
                  </Button>
                }
                title="Add Payment"
              >
                <PaymentForm 
                  purchaseId={purchaseId}
                  onSuccess={handlePaymentFormSuccess}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <PaymentList
                payments={payments}
                isLoading={paymentsLoading}
                onDeletePayment={handleDeletePayment}
                onEditPayment={handleEditPayment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div>Loading documents...</div>
              ) : (
                <DocumentUpload 
                  entityType="purchase" 
                  entityId={purchaseId} 
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
          title="Edit Purchase"
          open={showEditDialog}
          onOpenChange={(open) => !open && setShowEditDialog(false)}
        >
          <PurchaseForm 
            purchase={purchase} 
            onSuccess={handleEditSuccess} 
          />
        </SlideDialog>
      )}

      {/* Invoice edit dialog */}
      {invoiceToEdit && (
        <SlideDialog
          trigger={<></>}
          title="Edit Invoice"
          open={!!invoiceToEdit}
          onOpenChange={(open) => !open && setInvoiceToEdit(null)}
        >
          <InvoiceForm 
            purchaseId={purchaseId}
            invoice={invoiceToEdit}
            onSuccess={handleInvoiceFormSuccess}
          />
        </SlideDialog>
      )}

      {/* Payment edit dialog */}
      {paymentToEdit && (
        <SlideDialog
          trigger={<></>}
          title="Edit Payment"
          open={!!paymentToEdit}
          onOpenChange={(open) => !open && setPaymentToEdit(null)}
        >
          <PaymentForm 
            purchaseId={purchaseId}
            payment={paymentToEdit}
            onSuccess={handlePaymentFormSuccess}
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

      <DeleteConfirmation
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => deleteLoanMutation.mutate(loanToDelete!.id)}
        title="Delete Loan"
        description={`Are you sure you want to delete this loan? This action cannot be undone.`}
      />

      <DeleteConfirmation
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => deleteInvoiceMutation.mutate(invoiceToDelete!.id)}
        title="Delete Invoice"
        description={`Are you sure you want to delete this invoice? This action cannot be undone.`}
      />

      <DeleteConfirmation
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => deletePaymentMutation.mutate(paymentToDelete!.id)}
        title="Delete Payment"
        description={`Are you sure you want to delete this payment? This action cannot be undone.`}
      />
    </>
  );
} 