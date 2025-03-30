import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlideDialog } from "@/components/slide-dialog";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { PurchaseDetail } from "@/components/details/purchase-detail";
import { type Purchase, type Property, type Document as PropertyDocument } from "@/lib/schemas";
import { Plus, Trash2, ChevronLeft, CreditCard } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmation } from "@/components/delete-confirmation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/document-upload";
import { LoanForm } from "@/components/forms/loan-form";
import { Badge } from "@/components/ui/badge";
import {AcquisitionCostCard} from "@/components/acquisition-cost"; 

export default function PurchaseList() {
  const { toast } = useToast();
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<any | null>(null);
  
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch selected purchase details
  const { data: selectedPurchase } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${selectedPurchaseId}`],
    enabled: !!selectedPurchaseId,
  });

  // Fetch documents for selected purchase
  const { data: documents } = useQuery<PropertyDocument[]>({
    queryKey: [`/api/documents/purchase/${selectedPurchaseId}`],
    enabled: !!selectedPurchaseId,
  });

  // Fetch loans for selected purchase
  const { data: loans } = useQuery({
    queryKey: ["/api/loans", { purchase_id: selectedPurchaseId }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/loans?purchase_id=${selectedPurchaseId}`);
      return res.json();
    },
    enabled: !!selectedPurchaseId,
  });

  // Find property details for each purchase
  const purchasesWithProperties = purchases?.map(purchase => {
    const property = properties?.find(p => p.id === purchase.property_id);
    return { ...purchase, property };
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/purchases/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({
        title: "Purchase deleted",
        description: "The purchase has been deleted successfully.",
      });
      setPurchaseToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (loanId: number) => {
      const res = await apiRequest("DELETE", `/api/loans/${loanId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId, "loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId] });
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

  if (purchasesLoading) {
    return <div>Loading...</div>;
  }

  // Render purchase details when a purchase is selected
  if (selectedPurchaseId && selectedPurchase) {
    const property = properties?.find(p => p.id === selectedPurchase.property_id);

    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => setSelectedPurchaseId(null)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Purchases
            </Button>
            <h1 className="text-3xl font-bold">{property?.name || "Unknown Property"}</h1>
          </div>

          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Purchase Information</CardTitle>
                  <div className="flex space-x-2">
                    <SlideDialog
                      trigger={<Button variant="outline">Edit</Button>}
                      title="Edit Purchase"
                    >
                      <PurchaseForm 
                        purchase={selectedPurchase}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: [`/api/purchases/${selectedPurchaseId}`] });
                        }}
                      />
                    </SlideDialog>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => setPurchaseToDelete(selectedPurchase)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Purchase Date:</span> {new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Base Cost:</span> ₹{Number(selectedPurchase.base_cost).toLocaleString()}</p>
                  <p><span className="font-medium">Other Charges:</span> {selectedPurchase.other_charges ? `₹${Number(selectedPurchase.other_charges).toLocaleString()}` : 'None'}</p>
                  <p><span className="font-medium">Property Cost:</span> ₹{Number(selectedPurchase.property_cost).toLocaleString()}</p>
                  <p><span className="font-medium">IFMS:</span> {selectedPurchase.ifms ? `₹${Number(selectedPurchase.ifms).toLocaleString()}` : 'None'}</p>
                  <p><span className="font-medium">Lease Rent:</span> {selectedPurchase.lease_rent ? `₹${Number(selectedPurchase.lease_rent).toLocaleString()}` : 'None'}</p>
                  <p><span className="font-medium">AMC:</span> {selectedPurchase.amc ? `₹${Number(selectedPurchase.amc).toLocaleString()}` : 'None'}</p>
                  <p><span className="font-medium">Total Cost (before GST):</span> ₹{Number(selectedPurchase.total_cost).toLocaleString()}</p>
                  <p><span className="font-medium">GST:</span> {selectedPurchase.gst ? `₹${Number(selectedPurchase.gst).toLocaleString()}` : 'None'}</p>
                  <p><span className="font-medium">Final Price:</span> ₹{Number(selectedPurchase.total_sale_cost).toLocaleString()}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loans">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Loans</h2>
                <div className="flex space-x-2">
                  <SlideDialog
                    trigger={
                      <Button variant="outline">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Loan
                      </Button>
                    }
                    title="Add Loan"
                  >
                    <LoanForm 
                      purchaseId={selectedPurchase.id} 
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId] });
                        queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId, "loans"] });
                      }} 
                    />
                  </SlideDialog>
                </div>
              </div>

              {loans && loans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {loans.map((loan) => (
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
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Institution:</span> {loan.institution}</p>
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
                            <LoanForm 
                              loan={loan} 
                              onSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId] });
                                queryClient.invalidateQueries({ queryKey: ["/api/purchases", selectedPurchaseId, "loans"] });
                              }} 
                            />
                          </SlideDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No loans recorded for this purchase yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUpload
                    entityType="purchase"
                    entityId={selectedPurchaseId}
                    documents={documents || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Render purchase list
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Purchases</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Purchase
              </Button>
            }
            title="Add Purchase"
          >
            <PurchaseForm />
          </SlideDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {purchasesWithProperties?.length ? (
            purchasesWithProperties.map((purchase) => (
              <AcquisitionCostCard 
                key={purchase.id} 
                purchaseId={purchase.id} 
                purchase={purchase}
                onViewDetails={() => setSelectedPurchaseId(purchase.id)}
                onDelete={() => setPurchaseToDelete(purchase)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No purchases found. Create your first purchase using the "Add Purchase" button.</p>
            </div>
          )}
        </div>

        {/* Detail dialog */}
        {selectedPurchaseId && (
          <SlideDialog
            trigger={<></>}
            title="Purchase Details"
            open={!!selectedPurchaseId}
            onOpenChange={(open) => !open && setSelectedPurchaseId(null)}
          >
            <PurchaseDetail 
              purchaseId={selectedPurchaseId}
              onDelete={() => {
                setPurchaseToDelete(purchases?.find(p => p.id === selectedPurchaseId) || null);
                setSelectedPurchaseId(null);
              }}
              onClose={() => setSelectedPurchaseId(null)}
            />
          </SlideDialog>
        )}

        <DeleteConfirmation
          isOpen={!!purchaseToDelete}
          onClose={() => setPurchaseToDelete(null)}
          onConfirm={() => deleteMutation.mutate(purchaseToDelete!.id)}
          title="Delete Purchase"
          description={`Are you sure you want to delete this purchase? This action cannot be undone. Any associated loans and payments will also be deleted.`}
        />

        <DeleteConfirmation
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onConfirm={() => deleteLoanMutation.mutate(loanToDelete.id)}
          title="Delete Loan"
          description={`Are you sure you want to delete the loan "${loanToDelete?.name}"? This will also delete any associated payment sources. This action cannot be undone.`}
        />
      </main>
    </div>
  );
} 