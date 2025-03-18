import { useParams } from "wouter";
import { LoanDetail } from "@/components/details/loan-detail";
import { NavBar } from "@/components/nav-bar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const loanId = parseInt(id);
  
  if (isNaN(loanId)) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div>Invalid loan ID</div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/loans">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </Link>
        </div>
        <LoanDetail loanId={loanId} />
      </main>
    </div>
  );
} 