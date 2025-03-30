import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoanForm } from "@/components/forms/loan-form";
import { Plus, Landmark, Home, Trash2, ChevronLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from '@/lib/api/base';
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SlideDialog } from "@/components/slide-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/document-upload";
import { type LoanPublic } from "@/lib/api/schemas";
import { LoanRepaymentForm } from "@/components/forms/loan-repayment-form";
import { LoanList } from "@/components/lists/loan-list";

export default function LoanListPage() {
  const { toast } = useToast();
  
  const { data: loans, isLoading } = useQuery<LoanPublic[]>({
    queryKey: ["/api/loans"],
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loans</h1>
          
          <SlideDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            }
            title="Add Loan"
          >
            <LoanForm 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
              }}
            />
          </SlideDialog>
        </div>

        <LoanList 
          loans={loans}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
} 