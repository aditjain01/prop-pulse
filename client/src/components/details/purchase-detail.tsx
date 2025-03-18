import { useQuery, useMutation } from "@tanstack/react-query";
import { DetailView } from "@/components/detail-view";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { DocumentUpload } from "@/components/document-upload";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, Receipt, Plus, Pencil, Trash2 } from "lucide-react";
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

  // Fetch purchase details
  const { data: purchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${purchaseId}`],
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

  if (!purchaseId) return null;

  const handleEdit = () => {
    setShowEditDialog(true);
    
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
  };

  const handleLoanFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/loans", { purchase_id: purchaseId }] });
  };

  const handleInvoiceFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", { purchase_id: purchaseId }] });
  };


  return (
    <>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {purchase?.property_name ? `Purchase: ${purchase.property_name}` : "Purchase Details"}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {formatDate(purchase?.purchase_date || '')}
                </span>
              </div>
              <div className="flex space-x-2">
                <SlideDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={purchaseLoading}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Purchase
                    </Button>
                  }
                  title="Edit Purchase"
                  open={showEditDialog}
                  onOpenChange={setShowEditDialog}
                >
                  <PurchaseForm 
                    purchase={purchase} 
                    onSuccess={handleEditSuccess} 
                  />
                </SlideDialog>
                {onDelete || handleDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete || handleDelete}
                    disabled={purchaseLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {purchaseLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse">Loading...</div>
                </div>
              ) : purchase ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                      <p className="mt-1">{purchase.property_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Purchase Date</h3>
                      <p className="mt-1">{formatDate(purchase.purchase_date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Total Purchase Cost</h3>
                      <p className="mt-1">{formatCurrency(purchase.total_purchase_cost)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                      <p className="mt-1">{formatDate(purchase.registration_date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Possession Date</h3>
                      <p className="mt-1">{formatDate(purchase.possession_date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Seller</h3>
                      <p className="mt-1">{purchase.seller || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Base Cost</h3>
                      <p className="mt-1">{formatCurrency(purchase.base_cost)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Other Charges</h3>
                      <p className="mt-1">{formatCurrency(purchase.other_charges || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Property Cost</h3>
                      <p className="mt-1">{formatCurrency(purchase.property_cost)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">IFMS</h3>
                      <p className="mt-1">{formatCurrency(purchase.ifms || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Lease Rent</h3>
                      <p className="mt-1">{formatCurrency(purchase.lease_rent || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Annual Maintenance Charge</h3>
                      <p className="mt-1">{formatCurrency(purchase.amc || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">GST</h3>
                      <p className="mt-1">{formatCurrency(purchase.gst || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
                      <p className="mt-1 font-semibold">{formatCurrency(purchase.total_cost)}</p>
                    </div>
                  </div>

                  {purchase.remarks && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Remarks</h3>
                      <p className="mt-1 text-sm">{purchase.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Purchase not found</p>
                </div>
              )}
            </CardContent>
          </Card>
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