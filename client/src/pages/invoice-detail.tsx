import { useParams } from "wouter";
import { InvoiceDetail } from "@/components/details/invoice-detail";
import NotFound from "@/pages/not-found";
export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = parseInt(id);
  
  if (isNaN(invoiceId)) {
    return <NotFound message="Invoice doesn't exist" />;
  }
  
  return <InvoiceDetail invoiceId={invoiceId} />;
} 