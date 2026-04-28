import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense } from "react";

const Overview = lazy(() => import("./pages/Overview"));
const Customers = lazy(() => import("./pages/Customers"));
const Workers = lazy(() => import("./pages/Workers"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Revenue = lazy(() => import("./pages/Revenue"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const WorkerDetail = lazy(() => import("./pages/WorkerDetail"));
const ConversationDetail = lazy(() => import("./pages/ConversationDetail"));
const Alerts = lazy(() => import("./pages/Alerts"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 border-2 border-qiko-indigo/30 border-t-qiko-indigo rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Overview} />
          <Route path="/customers" component={Customers} />
          <Route path="/customers/:slug" component={CustomerDetail} />
          <Route path="/workers" component={Workers} />
          <Route path="/workers/:id" component={WorkerDetail} />
          <Route path="/conversations" component={Conversations} />
          <Route path="/conversations/:id" component={ConversationDetail} />
          <Route path="/revenue" component={Revenue} />
          <Route path="/activity" component={ActivityLogs} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
