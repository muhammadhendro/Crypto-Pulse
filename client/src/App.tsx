import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Exchange from "@/pages/Exchange";
import News from "@/pages/News";
import Settings from "@/pages/Settings";
import Detail from "@/pages/Detail";
import Analysis from "@/pages/Analysis";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/exchange" component={Exchange} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/news" component={News} />
      <Route path="/settings" component={Settings} />
      <Route path="/coin/:id" component={Detail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
