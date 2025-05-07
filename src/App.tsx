
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import TariffCalculator from "@/pages/TariffCalculator";
import TariffComparison from "@/pages/TariffComparison";
import TariffAnalysis from "@/pages/TariffAnalysis";
import Settings from "@/pages/Settings";
import YieldManagement from "@/pages/YieldManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/calcul" element={
            <MainLayout>
              <TariffCalculator />
            </MainLayout>
          } />
          <Route path="/comparaison" element={
            <MainLayout>
              <TariffComparison />
            </MainLayout>
          } />
          <Route path="/analyses" element={
            <MainLayout>
              <TariffAnalysis />
            </MainLayout>
          } />
          <Route path="/yield" element={
            <MainLayout>
              <YieldManagement />
            </MainLayout>
          } />
          <Route path="/parametres" element={
            <MainLayout>
              <Settings />
            </MainLayout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
