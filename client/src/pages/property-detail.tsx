import { useParams } from "wouter";
import { PropertyDetail } from "@/components/details/property-detail";
import NotFound from "@/pages/not-found";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const propertyId = id ? parseInt(id) : NaN;
  
  if (isNaN(propertyId)) {
    return <NotFound message="Property doesn't exist" />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href="/properties">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
          <PropertyDetail 
            propertyId={propertyId} 
            showHeader={true}
          />
        </div>
      </main>
    </div>
  );
} 