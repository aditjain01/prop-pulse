
import { useParams } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

interface Payment {
  id: number;
  milestone: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  source?: string;
}

interface Purchase {
  id: number;
  property_id: number;
  final_purchase_price: number;
  purchase_date: string;
  registration_date: string | null;
  possession_date: string | null;
  seller_info: string | null;
  remarks: string | null;
}

interface Loan {
  id: number;
  bank_name: string;
  interest_rate: number;
  loan_amount: number;
  emi_amount: number;
  tenure_months: number;
}

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const purchaseId = parseInt(id || '0');

  const { data: purchase, isLoading } = useQuery({
    queryKey: [`/api/purchases/${purchaseId}`],
    queryFn: async () => {
      const response = await fetch(`/api/purchases/${purchaseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch purchase");
      }
      return response.json() as Promise<Purchase>;
    },
    enabled: !!purchaseId
  });

  const { data: loans } = useQuery({
    queryKey: [`/api/loans?purchase_id=${purchaseId}`],
    queryFn: async () => {
      const response = await fetch(`/api/loans?purchase_id=${purchaseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch loans");
      }
      return response.json() as Promise<Loan[]>;
    },
    enabled: !!purchaseId
  });

  const { data: payments } = useQuery({
    queryKey: [`/api/payments?purchase_id=${purchaseId}`],
    queryFn: async () => {
      const response = await fetch(`/api/payments?purchase_id=${purchaseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json() as Promise<Payment[]>;
    },
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
                <p><span className="font-medium">Final Price:</span> ₹{Number(purchase.final_purchase_price).toLocaleString()}</p>
                <p><span className="font-medium">Registration Date:</span> {purchase.registration_date ? new Date(purchase.registration_date).toLocaleDateString() : 'Not registered'}</p>
                <p><span className="font-medium">Possession Date:</span> {purchase.possession_date ? new Date(purchase.possession_date).toLocaleDateString() : 'Not possessed'}</p>
                <p><span className="font-medium">Seller Info:</span> {purchase.seller_info || 'Not available'}</p>
                <p><span className="font-medium">Remarks:</span> {purchase.remarks || 'None'}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            {!loans?.length ? (
              <Card>
                <CardContent className="text-center py-6">
                  <p>No loans recorded for this purchase.</p>
                  <Button className="mt-4">Add Loan</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {loans.map((loan) => (
                  <Card key={loan.id}>
                    <CardHeader>
                      <CardTitle>{loan.bank_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><span className="font-medium">Amount:</span> ₹{Number(loan.loan_amount).toLocaleString()}</p>
                      <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                      <p><span className="font-medium">EMI:</span> ₹{Number(loan.emi_amount).toLocaleString()}/month</p>
                      <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments">
            {!payments?.length ? (
              <Card>
                <CardContent className="text-center py-6">
                  <p>No payments recorded for this purchase.</p>
                  <Button className="mt-4">Add Payment</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader>
                      <CardTitle>{payment.milestone}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><span className="font-medium">Amount:</span> ₹{Number(payment.amount).toLocaleString()}</p>
                      <p><span className="font-medium">Date:</span> {new Date(payment.payment_date).toLocaleDateString()}</p>
                      <p><span className="font-medium">Mode:</span> {payment.payment_mode}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="text-center py-6">
                <p>No documents uploaded for this purchase.</p>
                <Button className="mt-4">Upload Document</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
