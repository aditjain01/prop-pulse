import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, Home, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface LoanSummary {
  loan_name: string;
  property_name: string;
  loan_sanctioned_amount: string;
  loan_disbursed_amount: string;
  total_principal_paid: string;
  total_interest_paid: string;
  total_other_fees: string;
  total_penalties: string;
  total_amount_paid: string;
  total_payments: number;
  last_repayment_date: string;
  principal_balance: string;
}

interface Loan {
  id: number;
  name: string;
  institution: string;
  purchase_id: number;
  sanction_date: string;
  sanction_amount: number;
  total_disbursed_amount: number;
  interest_rate: number;
  tenure_months: number;
  agent?: string;
  is_active: boolean;
}

interface LoanStatusCardProps {
  loanId: number;
  onDelete?: (loan: Loan) => void;
  onViewDetails?: (loanId: number) => void;
}

export function LoanStatusCard({ 
  loanId, 
  onDelete, 
  onViewDetails 
}: LoanStatusCardProps) {
    // Fetch loan data
    const { data: loan, isLoading: loanLoading, error: loanError } = useQuery<Loan>({
        queryKey: [`/api/loans/${loanId}`],
    });

    // Fetch loan summary data
    const { data: loanSummaryData, isLoading: summaryLoading, error: summaryError } = useQuery<LoanSummary[], Error, LoanSummary | null>({
        queryKey: [`/api/loans/summary/?loan_id=${loanId}`],
        select: (data) => data && data.length > 0 ? data[0] : null,
    });

    // Fetch purchases and properties only when needed
    const { data: purchases } = useQuery({
        queryKey: ['/api/purchases'],
        enabled: !!loan, // Only fetch when loan data is available
    });

    const { data: properties } = useQuery({
        queryKey: ['/api/properties'],
        enabled: !!loan && !!purchases, // Only fetch when loan and purchases data is available
    });

    const getPurchaseName = (purchaseId: number) => {
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

    const handleDelete = () => {
        if (loan && onDelete) {
            onDelete(loan);
        }
    };

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(loanId);
        }
    };

    const isLoading = loanLoading || summaryLoading;
    const error = loanError || summaryError;

    if (isLoading) {
        return (
            <Card className="w-full mb-6 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle><Skeleton className="h-8 w-3/4" /></CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, index) => (
                            <Skeleton key={index} className="h-4 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full mb-6 overflow-hidden">
                <CardContent className="pt-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error.message || 'Failed to load loan data'}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!loanSummaryData && !loan) {
        return (
            <Card className="w-full mb-6 overflow-hidden">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">No loan data available</p>
                </CardContent>
            </Card>
        );
    }

    if (loan && !loanSummaryData){
        return (
            <Card className="w-full mb-6 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Badge variant={loan.is_active ? "default" : "secondary"}>
                            {loan.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
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

                    <div className="space-y-1 text-sm mb-4">
                        <p><span className="font-medium">Sanction Date:</span> {new Date(loan.sanction_date).toLocaleDateString()}</p>
                        <p><span className="font-medium">Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
                        <p><span className="font-medium">Disbursed:</span> ₹{Number(loan.total_disbursed_amount).toLocaleString()}</p>
                        <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                        <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                        {loan.agent && <p><span className="font-medium">Agent:</span> {loan.agent}</p>}
                    </div>

                    <div className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleViewDetails}
                        >
                            View Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full mb-6 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{loan.name}</CardTitle>
                <div className="flex items-center space-x-2">
                    <Badge variant={loan.is_active ? "default" : "secondary"}>
                        {loan.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleDelete}
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
                
                <div className="space-y-1 text-sm mb-4">
                    <p><span className="font-medium">Sanction Date:</span> {new Date(loan.sanction_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Amount:</span> ₹{Number(loan.sanction_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Disbursed:</span> ₹{Number(loan.total_disbursed_amount).toLocaleString()}</p>
                    <p><span className="font-medium">Interest Rate:</span> {loan.interest_rate}%</p>
                    <p><span className="font-medium">Tenure:</span> {loan.tenure_months} months</p>
                    {loan.agent && <p><span className="font-medium">Agent:</span> {loan.agent}</p>}
                </div>
                
                <div className="border-t pt-3 mt-3">
                    <h3 className="font-medium mb-2">Loan Status Summary</h3>
                    <div className="space-y-2 text-sm">
                        {[
                            { label: "Total Principal Paid", value: loanSummaryData.total_principal_paid },
                            { label: "Total Interest Paid", value: loanSummaryData.total_interest_paid },
                            { label: "Total Other Fees", value: loanSummaryData.total_other_fees },
                            { label: "Total Penalties", value: loanSummaryData.total_penalties },
                            { label: "Total Amount Paid", value: loanSummaryData.total_amount_paid },
                            { label: "Total Payments", value: loanSummaryData.total_payments },
                            { label: "Last Repayment Date", value: loanSummaryData.last_repayment_date },
                            { label: "Principal Balance", value: loanSummaryData.principal_balance },
                        ].map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{item.label}</span>
                                <span>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-4">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleViewDetails}
                    >
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
