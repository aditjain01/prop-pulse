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
import { Purchase, Loan, Payment, Document } from "@shared/schema";
import { PlusCircle } from "lucide-react";

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: purchase } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${id}`],
  });

  const { data: loans } = useQuery<Loan[]>({
    queryKey: ["/api/loans", { purchase_id: id }],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments", { purchase_id: id }],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: [`/api/documents/purchase/${id}`],
  });

  if (!purchase) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Purchase Details</h1>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Purchase Date:</span> {new Date(purchase.purchase_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Final Price:</span> ₹{Number(purchase.final_purchase_price).toLocaleString()}</p>
                <p><span className="font-medium">Registration Date:</span> {purchase.registration_date ? new Date(purchase.registration_date).toLocaleDateString() : 'Not registered'}</p>
                <p><span className="font-medium">Possession Date:</span> {purchase.possession_date ? new Date(purchase.possession_date).toLocaleDateString() : 'Not possessed'}</p>
                <p><span className="font-medium">Seller Info:</span> {purchase.seller_info}</p>
                <p><span className="font-medium">Remarks:</span> {purchase.remarks}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Loans</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Loan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <LoanForm purchaseId={purchase.id} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loans?.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader>
                    <CardTitle>{loan.bank_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><span className="font-medium">Amount:</span> ₹{Number(loan.loan_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                    <p><span className="font-medium">EMI:</span> ₹{Number(loan.emi_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payments</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <PaymentForm purchaseId={purchase.id} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {payments?.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{payment.milestone}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(payment.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payment.payment_mode} ({payment.source})</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </div>
  );
}
