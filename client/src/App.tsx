import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalDateFilterProvider } from "./contexts/DateFilterContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense, useEffect } from "react";

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
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

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

function PublicAuthRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route>
          {location.startsWith("/login") || location.startsWith("/signup") || location.startsWith("/forgot-password")
            ? <NotFound />
            : <Login />}
        </Route>
      </Switch>
    </Suspense>
  );
}

function PrivateRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading || !isAuthenticated) return <PageLoader />;

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
          <Route path="/admin-users" component={AdminUsers} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function Router() {
  const [location] = useLocation();
  const isPublicAuthPath =
    location.startsWith("/login") ||
    location.startsWith("/signup") ||
    location.startsWith("/forgot-password");

  return isPublicAuthPath ? <PublicAuthRoutes /> : <PrivateRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <GlobalDateFilterProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </GlobalDateFilterProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
