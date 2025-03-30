import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PropertyList from "@/pages/property-list";
import PropertyDetailPage from "@/pages/property-detail";
import PurchaseList from "@/pages/purchase-list";
import PurchaseDetailPage from "@/pages/purchase-detail";
import NotFound from "@/pages/not-found";
import PaymentList from "./pages/payment-list";
import PaymentDetailPage from "./pages/payment-detail";
import PaymentSourceList from "@/pages/payment-source-list";
import LoanList from "@/pages/loan-list";
import LoanDetailPage from "@/pages/loan-detail";
import RepaymentList from "@/pages/repayment-list";
import InvoiceList from "@/pages/invoice-list";
import InvoiceDetailPage from "@/pages/invoice-detail";
import { RouteComponentProps } from "wouter";

// Wrapper components to handle props for routes
const NotFoundWrapper = (props: RouteComponentProps) => <NotFound />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/properties" component={PropertyList} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/purchases" component={PurchaseList} />
      <Route path="/purchases/:id" component={PurchaseDetailPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/payments" component={PaymentList} />
      <Route path="/payments/:id" component={PaymentDetailPage} />
      <Route path="/payment-sources" component={PaymentSourceList} />
      <Route path="/loans" component={LoanList} />
      <Route path="/loans/:id" component={LoanDetailPage} />
      <Route path="/repayments" component={RepaymentList} />
      <Route path="/invoices" component={InvoiceList} />
      <Route path="/invoices/:id" component={InvoiceDetailPage} />
      <Route component={NotFoundWrapper} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
