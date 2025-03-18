import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { type Loan, type LoanRepayment, type Document as LoanDocument } from "@/lib/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUpload } from "@/components/document-upload";
import { RepaymentList } from "@/components/lists/repayment-list";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocation } from "wouter";

interface LoanDetailProps {
  loanId: number;
}

export function LoanDetail({ loanId }: LoanDetailProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddRepaymentDialogOpen, setIsAddRepaymentDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch loan details
  const { data: loan, isLoading } = useQuery<Loan>({
    queryKey: [`/api/v2/loans/${loanId}`],
    enabled: !!loanId,
  });

  // Fetch repayments for the loan
  const { data: repayments = [], isLoading: repaymentsLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/v2/repayments", { loan_id: loanId }],
    enabled: !!loanId,
  });

  // Fetch documents for this loan
  const { data: documents = [], isLoading: documentsLoading } = useQuery<LoanDocument[]>({
    queryKey: [`/api/v2/documents`, { entity_type: "loan", entity_id: loanId }],
    enabled: !!loanId,
  });

  // Delete loan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/v2/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/loans"] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      navigate("/loans");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });

  if (isLoading || !loan) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate outstanding principal
  const totalPrincipalPaid = repayments?.reduce(
    (sum, repayment) => sum + repayment.principal_amount,
    0
  ) || 0;
  
  const outstandingPrincipal = loan.total_disbursed_amount - totalPrincipalPaid;

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/v2/loans/${loanId}`] });
    setIsEditDialogOpen(false);
    toast({
      title: "Loan updated",
      description: "The loan has been updated successfully.",
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(loanId);
  };

  const handleAddRepayment = () => {
    setIsAddRepaymentDialogOpen(true);
  };

  const handleAddRepaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/v2/repayments", { loan_id: loanId }] });
    setIsAddRepaymentDialogOpen(false);
    toast({
      title: "Repayment added",
      description: "The repayment has been added successfully.",
    });
  };

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl">
                  {loan.name}
                </CardTitle>
                <CardDescription>
                  {loan.property_name || 'No property'} - {loan.institution}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <SlideDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Loan
                    </Button>
                  }
                  title="Edit Loan"
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <LoanForm 
                    loan={loan}
                    onSuccess={handleEditSuccess}
                  />
                </SlideDialog>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Date</h3>
                    <p className="mt-1">{formatDate(loan.sanction_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Amount</h3>
                    <p className="mt-1">{formatCurrency(loan.sanction_amount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Disbursed Amount</h3>
                    <p className="mt-1">{formatCurrency(loan.total_disbursed_amount)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Outstanding Principal</h3>
                    <p className="mt-1 font-semibold">{formatCurrency(outstandingPrincipal)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Interest Rate</h3>
                    <p className="mt-1">{loan.interest_rate}%</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tenure</h3>
                    <p className="mt-1">{loan.tenure_months} months</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Institution</h3>
                    <p className="mt-1">{loan.institution}</p>
                  </div>
                  {loan.agent && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Agent</h3>
                      <p className="mt-1">{loan.agent}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Processing Fee</h3>
                    <p className="mt-1">{formatCurrency(loan.processing_fee)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Other Charges</h3>
                    <p className="mt-1">{formatCurrency(loan.other_charges)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Charges</h3>
                    <p className="mt-1">{formatCurrency(loan.loan_sanction_charges)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1">{loan.is_active ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Loan Repayments</CardTitle>
              <SlideDialog
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Repayment
                  </Button>
                }
                title="Add Loan Repayment"
              >
                <LoanRepaymentForm 
                  loanId={loanId}
                  onSuccess={handleAddRepaymentSuccess}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <RepaymentList
                repayments={repayments}
                isLoading={repaymentsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Loan Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div>Loading documents...</div>
              ) : (
                <DocumentUpload 
                  entityType="loan" 
                  entityId={loanId} 
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
        onConfirm={handleConfirmDelete}
        title="Delete Loan"
        description="Are you sure you want to delete this loan? This action cannot be undone."
      />
    </div>
  );
}   