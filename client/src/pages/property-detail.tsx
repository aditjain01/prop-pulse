import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyForm } from "@/components/property-form";
import { PurchaseForm } from "@/components/purchase-form";
import { DocumentUpload } from "@/components/document-upload";
import { Property, Document } from "@shared/schema";
import { Edit, Upload } from "lucide-react";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: [`/api/documents/property/${id}`],
  });

  if (!property) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <PropertyForm property={property} />
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
                  <p><span className="font-medium">Status:</span> {property.status}</p>
                  <p><span className="font-medium">Current Price:</span> ₹{Number(property.current_price).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Area Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Carpet Area:</span> {property.carpet_area} sq.ft</p>
                  <p><span className="font-medium">Super Area:</span> {property.super_area} sq.ft</p>
                  <p><span className="font-medium">Builder Area:</span> {property.builder_area} sq.ft</p>
                  <p><span className="font-medium">Floor:</span> {property.floor_number}</p>
                </CardContent>
              </Card>
            </div>
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
