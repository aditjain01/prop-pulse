import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanForm } from "@/components/loan-form";
import { PaymentForm } from "@/components/payment-form";
import { DocumentUpload } from "@/components/document-upload";
import { Purchase, Loan, Payment, Document } from "shared/schema";
import { PlusCircle, CreditCard, Plus, Trash2, Landmark } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Badge } from "@/components/ui/badge";
import { SlideDialog } from "@/components/slide-dialog";

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const { data: purchase } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${id}`],
  });

  const { data: loans } = useQuery({
    queryKey: ["/api/purchases", id, "loans"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/purchases/${id}/loans`);
      return res.json();
    },
    enabled: !!purchase,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments", { purchase_id: id }],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: [`/api/documents/purchase/${id}`],
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
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

  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${loanId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", id, "loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", id] });
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

  if (!purchase) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Purchase Details</h1>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Purchase Date:</span> {new Date(purchase.purchase_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Base Cost:</span> ₹{Number(purchase.base_cost).toLocaleString()}</p>
                <p><span className="font-medium">Other Charges:</span> {purchase.other_charges ? `₹${Number(purchase.other_charges).toLocaleString()}` : 'None'}</p>
                <p><span className="font-medium">Property Cost:</span> ₹{Number(purchase.property_cost).toLocaleString()}</p>
                <p><span className="font-medium">IFMS:</span> {purchase.ifms ? `₹${Number(purchase.ifms).toLocaleString()}` : 'None'}</p>
                <p><span className="font-medium">Lease Rent:</span> {purchase.lease_rent ? `₹${Number(purchase.lease_rent).toLocaleString()}` : 'None'}</p>
                <p><span className="font-medium">AMC:</span> {purchase.amc ? `₹${Number(purchase.amc).toLocaleString()}` : 'None'}</p>
                <p><span className="font-medium">Total Cost (before GST):</span> ₹{Number(purchase.total_cost).toLocaleString()}</p>
                <p><span className="font-medium">GST:</span> {purchase.gst ? `₹${Number(purchase.gst).toLocaleString()}` : 'None'}</p>
                <p><span className="font-medium">Final Price:</span> ₹{Number(purchase.total_sale_cost).toLocaleString()}</p>
                <p><span className="font-medium">Registration Date:</span> {purchase.registration_date ? new Date(purchase.registration_date).toLocaleDateString() : 'Not registered'}</p>
                <p><span className="font-medium">Possession Date:</span> {purchase.possession_date ? new Date(purchase.possession_date).toLocaleDateString() : 'Not possessed'}</p>
                <p><span className="font-medium">Seller Info:</span> {purchase.seller || 'Not specified'}</p>
                <p><span className="font-medium">Remarks:</span> {purchase.remarks || 'None'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payments</h2>
              <div className="flex space-x-2">
                <SlideDialog
                  trigger={
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  }
                  title="Add Payment"
                >
                  <PaymentForm purchaseId={purchase.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/purchases", id] })} />
                </SlideDialog>
              </div>
            </div>

            {purchase.payments && purchase.payments.length > 0 ? (
              <div className="space-y-4">
                {purchase.payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">
                        ₹{Number(payment.amount).toLocaleString()}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setPaymentToDelete(payment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Payment Date</p>
                          <p>{new Date(payment.payment_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Payment Mode</p>
                          <p>{payment.payment_mode}</p>
                        </div>
                        {payment.payment_source && (
                          <div>
                            <p className="text-sm font-medium">Source</p>
                            <p>{payment.payment_source.name}</p>
                          </div>
                        )}
                        {payment.transaction_reference && (
                          <div>
                            <p className="text-sm font-medium">Reference</p>
                            <p>{payment.transaction_reference}</p>
                          </div>
                        )}
                        {payment.milestone && (
                          <div>
                            <p className="text-sm font-medium">Milestone</p>
                            <p>{payment.milestone}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No payments recorded yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="loans">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Loans</h2>
              <div className="flex space-x-2">
                <SlideDialog
                  trigger={
                    <Button variant="outline">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add Loan
                    </Button>
                  }
                  title="Add Loan"
                >
                  <LoanForm 
                    purchaseId={purchase.id} 
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/purchases", id] });
                      queryClient.invalidateQueries({ queryKey: ["/api/purchases", id, "loans"] });
                    }} 
                  />
                </SlideDialog>
              </div>
            </div>

            {loans && loans.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {loans.map((loan) => (
                  <Card key={loan.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={loan.is_active ? "default" : "secondary"}>
                          {loan.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setLoanToDelete(loan)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-3 mb-3">
                        <Landmark className="h-5 w-5" />
                        <span>{loan.institution}</span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Sanction Date:</span> {new Date(loan.sanction_date).toLocaleDateString()}</p>
                        <p><span className="font-medium">Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
                        <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                        <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                        {loan.agent && <p><span className="font-medium">Agent:</span> {loan.agent}</p>}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <SlideDialog
                          trigger={<Button variant="outline" size="sm">Edit</Button>}
                          title="Edit Loan"
                        >
                          <LoanForm 
                            loan={loan} 
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: ["/api/purchases", id] });
                              queryClient.invalidateQueries({ queryKey: ["/api/purchases", id, "loans"] });
                            }} 
                          />
                        </SlideDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No loans recorded for this purchase yet.</p>
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
                  entityType="purchase"
                  entityId={purchase.id}
                  documents={documents || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <DeleteConfirmation
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => deletePaymentMutation.mutate(paymentToDelete.id)}
        title="Delete Payment"
        description={`Are you sure you want to delete this payment of ₹${paymentToDelete ? Number(paymentToDelete.amount).toLocaleString() : 0}? This action cannot be undone.`}
      />

      <DeleteConfirmation
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => deleteLoanMutation.mutate(loanToDelete.id)}
        title="Delete Loan"
        description={`Are you sure you want to delete the loan "${loanToDelete?.name}"? This will also delete any associated payment sources. This action cannot be undone.`}
      />
    </div>
  );
}
