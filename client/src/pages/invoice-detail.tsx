import { useParams } from "wouter";
import { InvoiceDetail } from "@/components/details/invoice-detail";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = parseInt(id);
  
  if (isNaN(invoiceId)) {
    return <div>Invalid invoice ID</div>;
  }
  
  return <InvoiceDetail invoiceId={invoiceId} />;
} 