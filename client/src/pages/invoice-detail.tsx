import { useParams } from "wouter";
import { InvoiceDetail } from "@/components/details/invoice-detail";
import NotFound from "@/pages/not-found";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = id ? parseInt(id) : NaN;
  
  if (isNaN(invoiceId)) {
    return <NotFound message="Invoice doesn't exist" />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href="/invoices">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        <InvoiceDetail invoiceId={invoiceId} />
      </main>
    </div>
  );
} 