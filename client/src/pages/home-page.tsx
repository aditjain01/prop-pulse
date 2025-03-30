import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Building2, Wallet } from "lucide-react";
import { Property } from "@/lib/api/schemas";
import { Purchase } from "@/lib/api/schemas";

export default function HomePage() {
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const totalValue = properties?.reduce((sum, p) => sum + Number(p.current_rate), 0) || 0;
  const totalInvestment = purchases?.reduce((sum, p) => sum + Number(p.initial_rate), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalInvestment.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
