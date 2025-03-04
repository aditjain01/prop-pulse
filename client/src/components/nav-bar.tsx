import { Link } from "wouter";
import { Building2, LogOut, Home, CreditCard, Landmark, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold text-lg mr-6">Property Manager</Link>
        
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/properties" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <Building2 className="mr-1 h-4 w-4" />
              Properties
            </div>
          </Link>
          <Link href="/purchases" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <Home className="mr-1 h-4 w-4" />
              Purchases
            </div>
          </Link>
          <Link href="/payments" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              Payments
            </div>
          </Link>
          <Link href="/payment-sources" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <CreditCard className="mr-1 h-4 w-4" />
              Payment Sources
            </div>
          </Link>
          <Link href="/loans" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <Landmark className="mr-1 h-4 w-4" />
              Loans
            </div>
          </Link>
          <Link href="/repayments" className="text-sm font-medium transition-colors hover:text-primary">
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              Repayments
            </div>
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
