import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import IssueReporting from "@/pages/IssueReporting";
import SubmissionSuccess from "@/pages/SubmissionSuccess";

function Router() {
  return (
    <Switch>
      <Route path="/" component={IssueReporting} />
      <Route path="/success/:ticketId" component={SubmissionSuccess} />
      <Route component={NotFound} />
    </Switch>
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
