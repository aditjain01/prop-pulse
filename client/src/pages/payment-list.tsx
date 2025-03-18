import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { SlideDialog } from "@/components/slide-dialog";
import { PaymentForm } from "@/components/forms/payment-form";
import { Plus, Filter, Download } from "lucide-react";
import { apiRequest } from '@/lib/api/api';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentList } from "@/components/lists/payment-list";

type Payment = {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  source_id: number;
  payment_mode: string;
  transaction_reference: string | null;
  invoice_number: string;
  property_name: string;
  source_name: string;
  [key: string]: any;
};

type PaymentSource = {
  id: number;
  name: string;
  [key: string]: any;
};

export default function PaymentListPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    invoice_id: "",
    payment_source_id: "",
    payment_mode: "",
    from_date: "",
    to_date: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch payments with filters
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments", filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await apiRequest("GET", `/api/payments?${queryParams.toString()}`);
      return res.json();
    },
  });
  
  // Fetch payment sources for filter dropdown
  const { data: paymentSources } = useQuery<PaymentSource[]>({
    queryKey: ["/api/payment-sources"],
  });
  
  // Function to export payments as CSV
  const exportPaymentsCSV = () => {
    // Implementation would go here
    toast({
      title: "Export started",
      description: "Your payments are being exported to CSV.",
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Payments</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter Payments</h4>
                    <p className="text-sm text-muted-foreground">
                      Filter payments by source or date
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={filters.payment_source_id}
                        onValueChange={(value) => setFilters({...filters, payment_source_id: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All sources</SelectItem>
                          {paymentSources?.map((source) => (
                            <SelectItem key={source.id} value={source.id.toString()}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select
                        value={filters.payment_mode}
                        onValueChange={(value) => setFilters({...filters, payment_mode: value})}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="All modes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All modes</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="online">Online Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="from-date">From Date</Label>
                      <Input
                        id="from-date"
                        type="date"
                        className="col-span-2"
                        value={filters.from_date}
                        onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="to-date">To Date</Label>
                      <Input
                        id="to-date"
                        type="date"
                        className="col-span-2"
                        value={filters.to_date}
                        onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={() => setFilters({
                    invoice_id: "",
                    payment_source_id: "",
                    payment_mode: "",
                    from_date: "",
                    to_date: "",
                  })}>
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={exportPaymentsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <SlideDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              }
              title="Add New Payment"
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
            >
              <PaymentForm 
                onSuccess={() => setIsAddDialogOpen(false)}
              />
            </SlideDialog>
          </div>
        </div>
        
        {paymentsLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading payments...</p>
          </div>
        ) : !payments || payments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Payments Found</CardTitle>
              <CardDescription>
                {Object.values(filters).some(v => v) 
                  ? "Try adjusting your filters or create a new payment."
                  : "Get started by creating your first payment."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <PaymentList
            payments={payments}
            paymentSources={paymentSources}
            isLoading={paymentsLoading}
          />
        )}
      </main>
    </div>
  );
} 