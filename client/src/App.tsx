import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalDateFilterProvider } from "./contexts/DateFilterContext";
import { Provider } from "react-redux";
import { store } from "./store";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import { lazy, Suspense, useEffect } from "react";

const Overview = lazy(() => import("./pages/Overview"));
const Customers = lazy(() => import("./pages/Customers"));
const Workers = lazy(() => import("./pages/Workers"));
// const Conversations = lazy(() => import("./pages/Conversations"));
const Revenue = lazy(() => import("./pages/Revenue"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const EnterpriseCustomers = lazy(() => import("./pages/EnterpriseCustomers"));
const EnterpriseCustomerDetail = lazy(() => import("./pages/EnterpriseCustomerDetail"));
// const ConversationDetail = lazy(() => import("./pages/ConversationDetail"));
const Login = lazy(() => import("./pages/Login"));
const GoogleSetupScreen = lazy(() => import("./pages/GoogleSetupScreen"));
const AuthenticatorScreen = lazy(() => import("./pages/AuthenticatorScreen"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PasswordSet = lazy(() => import("./pages/PasswordSet"));
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
        <Route path="/login/setup" component={GoogleSetupScreen} />
        <Route path="/login/authenticator" component={AuthenticatorScreen} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/password-set" component={PasswordSet} />
        <Route>
          {location.startsWith("/login") ||
          location.startsWith("/signup") ||
          location.startsWith("/forgot-password") ||
          location.startsWith("/password-set")
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
          <Route path="/enterprise" component={EnterpriseCustomers} />
          <Route path="/enterprise/:slug" component={EnterpriseCustomerDetail} />
          <Route path="/workers" component={Workers} />
          {/* Conversations list + detail — hidden (restore lazy imports + routes to show again) */}
          {/* <Route path="/conversations" component={Conversations} /> */}
          {/* <Route path="/conversations/:id" component={ConversationDetail} /> */}
          {/* <Route path="/conversation-detail" component={ConversationDetail} /> */}
          <Route path="/revenue" component={Revenue} />
          <Route path="/activity" component={ActivityLogs} />
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
    location.startsWith("/forgot-password") ||
    location.startsWith("/password-set");

  return isPublicAuthPath ? <PublicAuthRoutes /> : <PrivateRoutes />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Provider store={store}>
          <AuthProvider>
            <GlobalDateFilterProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </GlobalDateFilterProvider>
          </AuthProvider>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
