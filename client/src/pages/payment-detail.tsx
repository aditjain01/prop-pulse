import { useParams } from "wouter";
import { PaymentDetail } from "@/components/details/payment-detail";
import { SlideDialog } from "@/components/slide-dialog";
import { NavBar } from "@/components/nav-bar";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/forms/payment-form";
import { Link } from "wouter";
export default function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = parseInt(id);
  
  if (isNaN(paymentId)) {
    return <div>Invalid payment ID</div>;
  }
  
  return (
  <div className="min-h-screen bg-background">
    <NavBar />
    <main className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </Link>
      </div>
      <PaymentDetail paymentId={paymentId} />;
    </main>
  </div>
  );
} 