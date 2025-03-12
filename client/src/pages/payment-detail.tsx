import { useParams } from "wouter";
import { PaymentDetail } from "@/components/details/payment-detail";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const paymentId = parseInt(id);
  
  if (isNaN(paymentId)) {
    return <div>Invalid payment ID</div>;
  }
  
  return <PaymentDetail paymentId={paymentId} />;
} 