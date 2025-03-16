import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PaymentSourceForm } from "@/components/forms/payment-source-form";
import { Plus, CreditCard, Wallet, Building, Landmark, Banknote, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { SlideDialog } from "@/components/slide-dialog";

export default function PaymentSourceList() {
  const { toast } = useToast();
  const [sourceToDelete, setSourceToDelete] = useState(null);
  
  const { data: paymentSources, isLoading } = useQuery({
    queryKey: ["/api/v2/payment-sources"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payment-sources/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2/payment-sources"] });
      toast({
        title: "Payment source deleted",
        description: "The payment source has been deleted successfully.",
      });
      setSourceToDelete(null);
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

  // Function to get the appropriate icon based on source type
  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'bank_account':
        return <Building className="h-5 w-5" />;
      case 'loan':
        return <Landmark className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'digital_wallet':
        return <Wallet className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      default:
        return <Banknote className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Payment Sources</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Source
              </Button>
            }
            title="Add Payment Source"
          >
            <PaymentSourceForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paymentSources?.length ? (
            paymentSources.map((source) => (
              <Card key={source.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{source.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSourceToDelete(source)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-3">
                    <CreditCard className="h-5 w-5" />
                    <span>{source.source_type}</span>
                  </div>
                  
                  {source.description && (
                    <p className="text-sm text-muted-foreground mb-4">{source.description}</p>
                  )}
                  
                  {source.source_type === 'bank_account' && (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Bank:</span> {source.bank_name}</p>
                      <p><span className="font-medium">Account:</span> {source.account_number}</p>
                      {source.ifsc_code && <p><span className="font-medium">IFSC:</span> {source.ifsc_code}</p>}
                    </div>
                  )}
                  
                  {source.source_type === 'loan' && (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Lender:</span> {source.lender}</p>
                    </div>
                  )}
                  
                  {source.source_type === 'credit_card' && (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Card:</span> {source.card_number}</p>
                      <p><span className="font-medium">Expiry:</span> {source.card_expiry}</p>
                    </div>
                  )}
                  
                  {source.source_type === 'digital_wallet' && (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Provider:</span> {source.wallet_provider}</p>
                      <p><span className="font-medium">ID:</span> {source.wallet_identifier}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <SlideDialog
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                      title="Edit Payment Source"
                    >
                      <PaymentSourceForm paymentSource={source} />
                    </SlideDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No payment sources found. Create your first payment source using the "Add Payment Source" button.</p>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmation
        isOpen={!!sourceToDelete}
        onClose={() => setSourceToDelete(null)}
        onConfirm={() => deleteMutation.mutate(sourceToDelete.id)}
        title="Delete Payment Source"
        description={`Are you sure you want to delete the payment source "${sourceToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
} 