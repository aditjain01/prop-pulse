import { useParams, useLocation } from "wouter";
import { LoanDetail } from "@/components/details/loan-detail";
import NotFound from "@/pages/not-found";
import { NavBar } from "@/components/nav-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { useState } from "react";

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const id = params?.id;
  const loanId = id ? parseInt(id) : undefined;

  // Fetch loan details to check if it exists
  const { data: loan, isLoading, isError } = useQuery({
    queryKey: [`/api/loans/${loanId}`],
    enabled: !!loanId,
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      navigate("/loans");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (loanId) {
      deleteLoanMutation.mutate(loanId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <NavBar />
        <div className="mt-6">Loading...</div>
      </div>
    );
  }

  if (isError || !loan || !loanId) {
    return (
      <div className="container mx-auto py-6">
        <NavBar />
        <div className="mt-6">
          <NotFound 
            title="Loan Not Found" 
            description="The loan you're looking for doesn't exist or you don't have access to it."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <NavBar />
      <div className="mt-6">
        <div className="mb-6">
          <Link href="/loans">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </Link>
        </div>

        <LoanDetail 
          loanId={loanId} 
          onDelete={handleDelete}
        />
      </div>

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Loan"
        description="Are you sure you want to delete this loan? This action cannot be undone."
      />
    </div>
  );
} 