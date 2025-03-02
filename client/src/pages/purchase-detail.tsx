import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

interface Purchase {
  id: number;
  property_id: number;
  purchase_date: string;
  registration_date: string | null;
  possession_date: string | null;
  final_purchase_price: number;
  seller_info: string | null;
  remarks: string | null;
}

interface Loan {
  id: number;
  bank_name: string;
  loan_amount: number;
  interest_rate: number;
  emi_amount: number;
  tenure_months: number;
}

interface Payment {
  id: number;
  milestone: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  source?: string;
}

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const purchaseId = parseInt(id || '0');

  const { data: purchase, isLoading } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${purchaseId}`],
    enabled: !!purchaseId
  });

  const { data: loans } = useQuery<Loan[]>({
    queryKey: [`/api/loans?purchase_id=${purchaseId}`],
    enabled: !!purchaseId
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: [`/api/payments?purchase_id=${purchaseId}`],
    enabled: !!purchaseId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">Loading...</main>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">Purchase not found</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Purchase Details</h1>
        </div>

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
                <p><span className="font-medium">Final Price:</span> ₹{purchase.final_purchase_price.toLocaleString()}</p>
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
                  <CardTitle>Add Loan</CardTitle>
                  <p className="text-center py-4">Loan form will go here</p>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loans?.length === 0 ? (
                <p>No loans added yet</p>
              ) : (
                loans?.map((loan) => (
                  <Card key={loan.id}>
                    <CardHeader>
                      <CardTitle>{loan.bank_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><span className="font-medium">Amount:</span> ₹{loan.loan_amount.toLocaleString()}</p>
                      <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                      <p><span className="font-medium">EMI:</span> ₹{loan.emi_amount.toLocaleString()}</p>
                      <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                    </CardContent>
                  </Card>
                ))
              )}
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
                  <CardTitle>Add Payment</CardTitle>
                  <p className="text-center py-4">Payment form will go here</p>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {payments?.length === 0 ? (
                <p>No payments recorded yet</p>
              ) : (
                payments?.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader>
                      <CardTitle>{payment.milestone}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><span className="font-medium">Amount:</span> ₹{payment.amount.toLocaleString()}</p>
                      <p><span className="font-medium">Date:</span> {new Date(payment.payment_date).toLocaleDateString()}</p>
                      <p><span className="font-medium">Source:</span> {payment.source}</p>
                      <p><span className="font-medium">Mode:</span> {payment.payment_mode}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4">Document upload and management will go here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}