import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { SlideDialog } from "@/components/slide-dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { type Loan, type LoanRepayment, type Document as LoanDocument } from "@/lib/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/document-upload";
import { RepaymentList } from "@/components/lists/repayment-list";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoanDetailProps {
  loanId: number;
  onDelete?: () => void;
  onClose?: () => void;
}

export function LoanDetail({ loanId, onDelete, onClose }: LoanDetailProps) {
  const { toast } = useToast();
  const [repaymentToDelete, setRepaymentToDelete] = useState<LoanRepayment | null>(null);
  const [repaymentToEdit, setRepaymentToEdit] = useState<LoanRepayment | null>(null);

  // Fetch loan details
  const { data: loan, isLoading } = useQuery<Loan>({
    queryKey: [`/api/loans/${loanId}`],
    enabled: !!loanId,
  });

  // Fetch repayments for the loan
  const { data: repayments = [], isLoading: repaymentsLoading } = useQuery<LoanRepayment[]>({
    queryKey: ["/api/repayments", { loan_id: loanId }],
    enabled: !!loanId,
  });

  // Fetch documents for this loan
  const { data: documents = [], isLoading: documentsLoading } = useQuery<LoanDocument[]>({
    queryKey: [`/api/documents`, { entity_type: "loan", entity_id: loanId }],
    enabled: !!loanId,
  });

  // Delete repayment mutation
  const deleteRepaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/repayments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: loanId }] });
      toast({
        title: "Repayment deleted",
        description: "The repayment has been deleted successfully.",
      });
      setRepaymentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !loan) {
    return <div>Loading...</div>;
  }

  // Calculate outstanding principal
  const totalPrincipalPaid = repayments?.reduce(
    (sum, repayment) => sum + repayment.principal_amount,
    0
  ) || 0;
  
  const outstandingPrincipal = loan.total_disbursed_amount - totalPrincipalPaid;

  const handleDeleteRepayment = (repayment: LoanRepayment) => {
    setRepaymentToDelete(repayment);
  };

  const handleEditRepayment = (repayment: LoanRepayment) => {
    setRepaymentToEdit(repayment);
  };

  const handleRepaymentFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: loanId }] });
    setRepaymentToEdit(null);
  };

  return (
    <>
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Loan Information</CardTitle>
              <div className="flex space-x-2">
                <SlideDialog
                  trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Edit</Button>}
                  title="Edit Loan"
                >
                  <LoanForm 
                    loan={loan}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: [`/api/loans/${loanId}`] });
                    }}
                  />
                </SlideDialog>
                
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Date</h3>
                    <p className="mt-1">{loan.sanction_date}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Amount</h3>
                    <p className="mt-1">₹{loan.sanction_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Disbursed Amount</h3>
                    <p className="mt-1">₹{loan.total_disbursed_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Outstanding Principal</h3>
                    <p className="mt-1 font-semibold">₹{outstandingPrincipal.toLocaleString()}</p>
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
                    <p className="mt-1">₹{loan.processing_fee?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Other Charges</h3>
                    <p className="mt-1">₹{loan.other_charges?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sanction Charges</h3>
                    <p className="mt-1">₹{loan.loan_sanction_charges?.toLocaleString() || 0}</p>
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
              <CardTitle>Repayments</CardTitle>
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
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: loanId }] });
                  }}
                />
              </SlideDialog>
            </CardHeader>
            <CardContent>
              <RepaymentList
                repayments={repayments}
                isLoading={repaymentsLoading}
                onDeleteRepayment={handleDeleteRepayment}
                onEditRepayment={handleEditRepayment}
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

      {onClose && (
        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      )}

      {/* Repayment edit dialog */}
      {repaymentToEdit && (
        <SlideDialog
          trigger={<></>}
          title="Edit Loan Repayment"
          open={!!repaymentToEdit}
          onOpenChange={(open) => !open && setRepaymentToEdit(null)}
        >
          <LoanRepaymentForm 
            loanId={loanId}
            repayment={repaymentToEdit}
            onSuccess={handleRepaymentFormSuccess}
          />
        </SlideDialog>
      )}

      {/* Repayment delete confirmation */}
      <DeleteConfirmation
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteRepaymentMutation.mutate(repaymentToDelete!.id)}
        title="Delete Repayment"
        description={`Are you sure you want to delete this repayment? This action cannot be undone.`}
      />
    </>
  );
} 