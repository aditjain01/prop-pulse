import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyForm } from "@/components/property-form";
import { PurchaseForm } from "@/components/purchase-form";
import { DocumentUpload } from "@/components/document-upload";
import { Property, Document, Purchase } from "shared/schema";
import { Edit, Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: [`/api/properties/${id}`],
  });

  const { data: documents } = useQuery({
    queryKey: [`/api/documents/property/${id}`],
    enabled: !!property,
  });

  const { data: purchases } = useQuery({
    queryKey: [`/api/purchases/property/${id}`],
    enabled: !!property,
  });

  if (propertyLoading || !property) {
    return <div>Loading property details...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{property.name}</h1>
          
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <PropertyForm 
                  property={property} 
                  onSuccess={() => {
                    // Force a refetch of the property data
                    queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}`] });
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Purchase
                </Button>
              </DialogTrigger>
              <DialogContent>
                <PurchaseForm propertyId={property.id} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Address:</span> {property.address}</p>
                  <p><span className="font-medium">Type:</span> {property.property_type}</p>
                  <p><span className="font-medium">Developer:</span> {property.developer || 'Not specified'}</p>
                  <p><span className="font-medium">RERA ID:</span> {property.rera_id || 'Not specified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Area Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Carpet Area:</span> {property.carpet_area} sq.ft</p>
                  <p><span className="font-medium">Super Area:</span> {property.super_area} sq.ft</p>
                  <p><span className="font-medium">Floor:</span> {property.floor_number}</p>
                  <p><span className="font-medium">Current Rate:</span> ₹{Number(property.current_rate).toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                {purchases && purchases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">ID</th>
                          <th className="text-left py-2 px-4">Date</th>
                          <th className="text-left py-2 px-4">Price</th>
                          <th className="text-left py-2 px-4">Seller</th>
                          <th className="text-left py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => (
                          <tr 
                            key={purchase.id} 
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-2 px-4">{purchase.id}</td>
                            <td className="py-2 px-4">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                            <td className="py-2 px-4">₹{Number(purchase.total_cost).toLocaleString()}</td>
                            <td className="py-2 px-4">{purchase.seller || "N/A"}</td>
                            <td className="py-2 px-4">
                              <Link href={`/purchases/${purchase.id}`}>
                                <Button variant="outline" size="sm" > View Details </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No purchases recorded for this property.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  entityType="property"
                  entityId={property.id}
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
