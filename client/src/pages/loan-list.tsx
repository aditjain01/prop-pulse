import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoanForm } from "@/components/loan-form";
import { Plus, Landmark, Home, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";

export default function LoanList() {
  const { toast } = useToast();
  const [loanToDelete, setLoanToDelete] = useState(null);
  
  const { data: loans, isLoading } = useQuery({
    queryKey: ["/api/loans"],
  });

  // Fetch purchases to display purchase details
  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
  });
  
  // Fetch properties to get property names
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-sources"] });
      toast({
        title: "Loan deleted",
        description: "The loan has been deleted successfully.",
      });
      setLoanToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Function to get purchase name by ID
  const getPurchaseName = (purchaseId) => {
    if (!purchaseId) return "Unknown Property";
    
    const purchase = purchases?.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    // If purchase has property object directly
    if (purchase.property && purchase.property.name) {
      return purchase.property.name;
    }
    
    // If purchase only has property_id
    if (purchase.property_id) {
      const property = properties?.find(p => p.id === purchase.property_id);
      return property ? property.name : "Unknown Property";
    }
    
    return "Unknown Property";
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loans</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            }
            title="Add Loan"
          >
            <LoanForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loans?.length ? (
            loans.map((loan) => (
              <Card key={loan.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={loan.is_active ? "default" : "secondary"}>
                      {loan.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setLoanToDelete(loan)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-3">
                    <Landmark className="h-5 w-5" />
                    <span>{loan.institution}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <Home className="h-5 w-5" />
                    <span>{getPurchaseName(loan.purchase_id)}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Sanction Date:</span> {new Date(loan.sanction_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                    <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                    {loan.agent && <p><span className="font-medium">Agent:</span> {loan.agent}</p>}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <SlideDialog
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                      title="Edit Loan"
                    >
                      <LoanForm loan={loan} />
                    </SlideDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No loans found. Create your first loan using the "Add Loan" button.</p>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmation
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => deleteMutation.mutate(loanToDelete.id)}
        title="Delete Loan"
        description={`Are you sure you want to delete the loan "${loanToDelete?.name}"? This will also delete any associated payment sources. This action cannot be undone.`}
      />
    </div>
  );
} 