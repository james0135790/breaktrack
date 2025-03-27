import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import WellnessInsights from "@/pages/wellness-insights";
import DepartmentsPage from "@/pages/departments";

function Navigation() {
  const [location] = useLocation();
  
  // Don't show navigation on login/signup pages
  if (location === "/login" || location === "/signup") {
    return null;
  }
  
  // Don't show on landing page either
  if (location === "/") {
    return null;
  }
  
  return (
    <div className="bg-primary text-white p-4 mb-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="text-xl font-bold cursor-pointer">Break Management</div>
        </Link>
        <div className="flex gap-4">
          <Link href="/login">
            <span className="text-white hover:text-blue-100 cursor-pointer">Login</span>
          </Link>
          <Link href="/signup">
            <span className="text-white hover:text-blue-100 cursor-pointer">Sign Up</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/departments" component={DepartmentsPage} />
        <Route path="/wellness-insights" component={WellnessInsights} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
