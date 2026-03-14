import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DatabasePage from "./pages/database";
import CollaborationPage from "./pages/collaboration";
import CompetitorResearcherPage from "./pages/agents/competitor-researcher";
import KeywordAnalystPage from "./pages/agents/keyword-analyst";
import ContentWriterPage from "./pages/agents/content-writer";
import ContentComposerPage from "./pages/agents/content-composer";
import ContentAnalystPage from "./pages/agents/content-analyst";
import PerformanceReviewerPage from "./pages/agents/performance-reviewer";
import OpportunityExplorerPage from "./pages/agents/opportunity-explorer";
import SchemaGeneratorPage from "./pages/agents/schema-generator";
import PrototyperPage from "./pages/agents/prototyper";
import SettingsPage from "./pages/settings";
import SeoAuditorPage from "./pages/seo-auditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/collaboration" element={<CollaborationPage />} />
            <Route path="/agents/competitor-researcher" element={<CompetitorResearcherPage />} />
            <Route path="/agents/keyword-analyst" element={<KeywordAnalystPage />} />
            <Route path="/agents/content-writer" element={<ContentWriterPage />} />
            <Route path="/agents/content-composer" element={<ContentComposerPage />} />
            <Route path="/agents/content-analyst" element={<ContentAnalystPage />} />
            <Route path="/agents/performance-reviewer" element={<PerformanceReviewerPage />} />
            <Route path="/agents/opportunity-explorer" element={<OpportunityExplorerPage />} />
            <Route path="/agents/schema-generator" element={<SchemaGeneratorPage />} />
            <Route path="/agents/prototyper" element={<PrototyperPage />} />
            <Route path="/seo-auditor" element={<SeoAuditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
