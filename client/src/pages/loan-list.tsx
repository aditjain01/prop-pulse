import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { Plus, Landmark, Home, Trash2, ChevronLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/document-upload";
import { type Loan, type Document as PropertyDocument } from "@/lib/schemas";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { LoanDetail } from "@/components/details/loan-detail";
import { LoanStatusCard } from "@/components/loan-status";
export default function LoanList() {
  const { toast } = useToast();
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [repaymentToDelete, setRepaymentToDelete] = useState<any | null>(null);
  
  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  // Fetch purchases to display purchase details
  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch properties to get property names
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Fetch selected loan details
  const { data: selectedLoan } = useQuery<Loan>({
    queryKey: [`/api/loans/${selectedLoanId}`],
    enabled: !!selectedLoanId,
  });

  // Fetch documents for selected loan
  const { data: documents } = useQuery<PropertyDocument[]>({
    queryKey: [`/api/documents/loan/${selectedLoanId}`],
    enabled: !!selectedLoanId,
  });

  // Fetch repayments for selected loan
  const { data: repayments } = useQuery({
    queryKey: ["/api/repayments", { loan_id: selectedLoanId }],
    enabled: !!selectedLoanId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      setLoanToDelete(null);
      setSelectedLoanId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRepaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/repayments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: selectedLoanId }] });
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Function to get purchase name by ID
  const getPurchaseName = (purchaseId: number) => {
    if (!purchaseId) return "Unknown Property";
    
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    // If purchase has property object directly
    if (purchase.property && purchase.property.name) {
      return purchase.property.name;
    }
    
    // If purchase only has property_id
    if (purchase.property_id) {
      const property = properties?.find(p => p.id === purchase.property_id);
      return property ? property.name : "Unknown Property";
    }
    
    return "Unknown Property";
  };

  // Function to handle delete
  const handleDelete = (loan: Loan) => {
    setLoanToDelete(loan);
  };

  // Function to view loan details
  const handleViewDetails = (loanId: number) => {
    setSelectedLoanId(loanId);
  };
  console.log(loans)
  // Render loan details when a loan is selected
  if (selectedLoanId && selectedLoan) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => setSelectedLoanId(null)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
            <h1 className="text-3xl font-bold">{selectedLoan.name}</h1>
          </div>

          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
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
                      trigger={<Button variant="outline">Edit</Button>}
                      title="Edit Loan"
                    >
                      <LoanForm 
                        loan={selectedLoan}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: [`/api/loans/${selectedLoanId}`] });
                        }}
                      />
                    </SlideDialog>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => setLoanToDelete(selectedLoan)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-3 mb-3">
                    <Landmark className="h-5 w-5" />
                    <span>{selectedLoan.institution}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <Home className="h-5 w-5" />
                    <span>{getPurchaseName(selectedLoan.purchase_id)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p><span className="font-medium">Status:</span> {selectedLoan.is_active ? "Active" : "Inactive"}</p>
                    <p><span className="font-medium">Sanction Date:</span> {new Date(selectedLoan.sanction_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Amount:</span> ₹{Number(selectedLoan.sanction_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Interest Rate:</span> {selectedLoan.interest_rate}%</p>
                    <p><span className="font-medium">Tenure:</span> {selectedLoan.tenure_months} months</p>
                    {selectedLoan.agent && <p><span className="font-medium">Agent:</span> {selectedLoan.agent}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repayments">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Repayments</h2>
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
                    loanId={selectedLoanId} 
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: selectedLoanId }] });
                    }}
                  />
                </SlideDialog>
              </div>

              {repayments && repayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-left py-2 px-4">Principal</th>
                        <th className="text-left py-2 px-4">Interest</th>
                        <th className="text-left py-2 px-4">Total</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repayments.map((repayment) => {
                        const total = (
                          (repayment.principal_amount || 0) +
                          (repayment.interest_amount || 0) +
                          (repayment.other_fees || 0) +
                          (repayment.penalties || 0)
                        );
                        
                        return (
                          <tr 
                            key={repayment.id} 
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-2 px-4">{new Date(repayment.payment_date).toLocaleDateString()}</td>
                            <td className="py-2 px-4">₹{Number(repayment.principal_amount).toLocaleString()}</td>
                            <td className="py-2 px-4">₹{Number(repayment.interest_amount).toLocaleString()}</td>
                            <td className="py-2 px-4">₹{Number(total).toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <div className="flex items-center space-x-2">
                                <SlideDialog
                                  trigger={<Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>}
                                  title="Edit Loan Repayment"
                                >
                                  <LoanRepaymentForm 
                                    loanId={selectedLoanId}
                                    repayment={repayment}
                                    onSuccess={() => {
                                      queryClient.invalidateQueries({ queryKey: ["/api/repayments", { loan_id: selectedLoanId }] });
                                    }}
                                  />
                                </SlideDialog>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setRepaymentToDelete(repayment)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No repayments recorded for this loan yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUpload
                    entityType="loan"
                    entityId={selectedLoanId}
                    documents={documents || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Render loan list
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loans</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            }
            title="Add Loan"
          >
            <LoanForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loans?.length ? (
            loans.map((loan) => (
              <LoanStatusCard 
                key={loan.id} 
                loanId={loan.id}
                onDelete={() => handleDelete(loan)}
                onViewDetails={() => handleViewDetails(loan.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No loans found. Create your first loan using the "Add Loan" button.</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail dialog */}
      {selectedLoanId && (
        <SlideDialog
          trigger={<></>}
          title="Loan Details"
          open={!!selectedLoanId}
          onOpenChange={(open) => !open && setSelectedLoanId(null)}
        >
          <LoanDetail 
            loanId={selectedLoanId}
            onDelete={() => {
              setLoanToDelete(loans?.find(l => l.id === selectedLoanId) || null);
              setSelectedLoanId(null);
            }}
            onClose={() => setSelectedLoanId(null)}
          />
        </SlideDialog>
      )}

      <DeleteConfirmation
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => deleteMutation.mutate(loanToDelete!.id)}
        title="Delete Loan"
        description={`Are you sure you want to delete this loan? This action cannot be undone.`}
      />

      <DeleteConfirmation
        isOpen={!!repaymentToDelete}
        onClose={() => setRepaymentToDelete(null)}
        onConfirm={() => deleteRepaymentMutation.mutate(repaymentToDelete.id)}
        title="Delete Repayment"
        description={`Are you sure you want to delete this repayment? This action cannot be undone.`}
      />
    </div>
  );
} 