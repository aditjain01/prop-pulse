import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PropertyList from "@/pages/property-list";
import PropertyDetail from "@/pages/property-detail";
import PurchaseList from "@/pages/purchase-list";
import PurchaseDetail from "@/pages/purchase-detail";
import NotFound from "@/pages/not-found";
import PaymentList from "./pages/payment-list";
import PaymentSourceList from "@/pages/payment-source-list";
import LoanList from "@/pages/loan-list";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/properties" component={PropertyList} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/purchases" component={PurchaseList} />
      <Route path="/purchases/:id" component={PurchaseDetail} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/payments" component={PaymentList} />
      <Route path="/payment-sources" component={PaymentSourceList} />
      <Route path="/loans" component={LoanList} />
      <Route component={NotFound} />
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
