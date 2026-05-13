import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionExpiredBridge } from "@/components/SessionExpiredBridge";

// Pages
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import ManasikPage from "@/pages/manasik";
import PlacesPage from "@/pages/places";
import AddPlacePage from "@/pages/add-place";
import NavigatePage from "@/pages/navigate";
import GroupPage from "@/pages/group";
import EmergencyPage from "@/pages/emergency";
import ProfilePage from "@/pages/profile";
import DuasPage from "@/pages/duas";
import DuasCategoryPage from "@/pages/duas-category";
import DuasDetailPage from "@/pages/duas-detail";
import NusukSelectPage from "@/pages/nusuk-select";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/manasik" component={ManasikPage} />
      <Route path="/places" component={PlacesPage} />
      <Route path="/places/new" component={AddPlacePage} />
      <Route path="/navigate/:sessionId" component={NavigatePage} />
      <Route path="/group" component={GroupPage} />
      <Route path="/emergency" component={EmergencyPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/duas" component={DuasPage} />
      <Route path="/duas/cat/:categoryId" component={DuasCategoryPage} />
      <Route path="/duas/view/:id" component={DuasDetailPage} />
      <Route path="/nusuk-select" component={NusukSelectPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <SessionExpiredBridge />
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
