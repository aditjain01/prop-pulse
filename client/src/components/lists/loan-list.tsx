import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Landmark, Home } from "lucide-react";
import { type Loan, type Property, type Purchase } from "@/lib/schemas";

type LoanListProps = {
  loans: Loan[] | undefined;
  purchases?: Purchase[] | undefined;
  properties?: Property[] | undefined;
  isLoading: boolean;
  onDeleteLoan?: (loan: Loan) => void;
  onViewLoan?: (loanId: number) => void;
};

export function LoanList({ 
  loans, 
  purchases, 
  properties, 
  isLoading, 
  onDeleteLoan,
  onViewLoan 
}: LoanListProps) {
  if (isLoading) {
    return <div className="flex justify-center items-center py-10">Loading loans...</div>;
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="col-span-full text-center py-10">
        <p className="text-muted-foreground">No loans found. Create your first loan using the "Add Loan" button.</p>
      </div>
    );
  }

  // Helper function to get property name
  const getPropertyName = (purchaseId: number): string => {
    if (!purchases) return "Unknown Property";
    
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return "Unknown Property";
    
    // If purchase has property object directly
    if (purchase.property) {
      return purchase.property.name;
    }
    
    // If purchase only has property_id
    if (purchase.property_id && properties) {
      const property = properties.find(p => p.id === purchase.property_id);
      return property ? property.name : "Unknown Property";
    }
    
    return "Unknown Property";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {loans.map((loan) => (
        <Card key={loan.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={loan.is_active ? "default" : "secondary"}>
                {loan.is_active ? "Active" : "Inactive"}
              </Badge>
              {onDeleteLoan && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onDeleteLoan(loan)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-3">
              <Landmark className="h-5 w-5" />
              <span>{loan.institution}</span>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <Home className="h-5 w-5" />
              <span>{getPropertyName(loan.purchase_id)}</span>
            </div>
            
            <div className="space-y-1 text-sm mb-4">
              <p><span className="font-medium">Sanction Date:</span> {new Date(loan.sanction_date).toLocaleDateString()}</p>
              <p><span className="font-medium">Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
              <p><span className="font-medium">Disbursed:</span> ₹{Number(loan.total_disbursed_amount).toLocaleString()}</p>
              <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
              <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
              {loan.agent && <p><span className="font-medium">Agent:</span> {loan.agent}</p>}
            </div>

            {onViewLoan && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => onViewLoan(loan.id)}
              >
                View Details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 