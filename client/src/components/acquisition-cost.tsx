import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// Helper function to format currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

interface AcquisitionCostSummary {
  user_id?: number;
  purchase_id?: number;
  property_name?: string;
  total_loan_principal?: number;
  total_loan_interest?: number;
  total_loan_others?: number;
  total_loan_payment?: number;
  total_builder_principal?: number;
  total_builder_payment?: number;
  total_principal_payment?: number;
  total_sale_cost?: number;
  remaining_balance?: number;
}

interface AcquisitionCostCardProps {
  purchaseId: number;
  purchase?: any; // You might want to type this properly
  onViewDetails?: () => void;
  onDelete?: () => void;
}

export function AcquisitionCostCard({ 
  purchaseId, 
  purchase, 
  onViewDetails, 
  onDelete 
}: AcquisitionCostCardProps) {
  const { data: summaryData, isLoading, error } = useQuery<AcquisitionCostSummary[], Error, AcquisitionCostSummary | null>({
    queryKey: [`/api/acquisition-cost/summary?purchase_id=${purchaseId}`],
    select: (data) => data && data.length > 0 ? data[0] : null,
  });

  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-3/4" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mb-6">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error.message || 'Failed to load acquisition cost data'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If we have purchase data but no summary data yet
  if (purchase && !summaryData) {
    return (
      <Card key={purchase.id} className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            {purchase.property?.name || "Unknown Property"}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Purchase Date: {new Date(purchase.purchase_date).toLocaleDateString()}
          </p>
          <p className="font-medium mb-4">
            ₹{Number(purchase.total_sale_cost).toLocaleString()}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="w-full mb-6">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No acquisition cost data available</p>
        </CardContent>
      </Card>
    );
  }

  // Render the full card with both purchase info and acquisition cost data
  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>
            {purchase?.property?.name || summaryData.property_name || "Unknown Property"}
          </CardTitle>
          <CardDescription>
            {purchase && `Purchase Date: ${new Date(purchase.purchase_date).toLocaleDateString()}`}
          </CardDescription>
        </div>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Purchase Summary */}
          {purchase && (
            <div>
              <h3 className="text-lg font-medium">Purchase Summary</h3>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total Sale Cost</span>
                  <span>₹{Number(purchase.total_sale_cost).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loan Payments Section */}
          <div>
            <h3 className="text-lg font-medium">Loan Payments</h3>
            <Separator className="my-2" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Principal</span>
                <span>{formatCurrency(summaryData.total_loan_principal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest</span>
                <span>{formatCurrency(summaryData.total_loan_interest)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Fees</span>
                <span>{formatCurrency(summaryData.total_loan_others)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Loan Payment</span>
                <span>{formatCurrency(summaryData.total_loan_payment)}</span>
              </div>
            </div>
          </div>

          {/* Builder Payments Section */}
          <div>
            <h3 className="text-lg font-medium">Builder Payments</h3>
            <Separator className="my-2" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Principal</span>
                <span>{formatCurrency(summaryData.total_builder_principal)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Builder Payment</span>
                <span>{formatCurrency(summaryData.total_builder_payment)}</span>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div>
            <h3 className="text-lg font-medium">Summary</h3>
            <Separator className="my-2" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Principal Payment</span>
                <span>{formatCurrency(summaryData.total_principal_payment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sale Cost</span>
                <span>{formatCurrency(summaryData.total_sale_cost)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Remaining Balance</span>
                <span>{formatCurrency(summaryData.remaining_balance)}</span>
              </div>
            </div>
          </div>
          
          {/* View Details Button */}
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
