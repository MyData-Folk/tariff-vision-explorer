
import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fetchPlans, fetchPartners } from "@/services/partnerService";
import { fetchDailyBaseRates } from "@/services/rateService";
import { Plan, Partner } from "@/services/types";
import { toast } from "sonner";
import { 
  ComparisonForm, 
  ChartVisualization, 
  DifferenceAnalysis, 
  DataTable,
  SelectedPartner,
  ChartData
} from "@/components/tariff-comparison";
import { transformDataForChart, calculateDifferences } from "@/utils/tariff-utils";

const TariffComparison = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [comparisonMode, setComparisonMode] = useState<string>("line");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<SelectedPartner[]>([{
    partnerId: "",
    partnerName: "",
    planId: "",
    planName: ""
  }]);
  const [hasCompared, setHasCompared] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  
  useEffect(() => {
    // Load plans and partners when page loads
    const loadInitialData = async () => {
      try {
        const [plans, partners] = await Promise.all([
          fetchPlans(),
          fetchPartners()
        ]);
        
        setAllPlans(plans);
        setAllPartners(partners);
        
        if (partners.length > 0) {
          setSelectedPartners([
            {
              partnerId: partners[0].id,
              partnerName: partners[0].name,
              planId: "",
              planName: ""
            }
          ]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données initiales:", error);
        toast.error("Impossible de charger les données initiales");
      }
    };
    
    loadInitialData();
  }, []);

  const handleCompare = async () => {
    // Check that all selections are complete
    const isSelectionComplete = selectedPartners.every(
      partner => partner.partnerId && partner.planId
    );
    
    if (!isSelectionComplete) {
      toast.error("Veuillez sélectionner un partenaire et un plan pour chaque comparaison");
      return;
    }
    
    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner une plage de dates");
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedStartDate = format(dateRange.from, "yyyy-MM-dd");
      const formattedEndDate = format(dateRange.to, "yyyy-MM-dd");
      
      const dailyRates = await fetchDailyBaseRates(formattedStartDate, formattedEndDate);
      
      if (dailyRates.length === 0) {
        toast.warning("Pas de données disponibles pour cette période");
        const data = await transformDataForChart([], dateRange, selectedPartners);
        setChartData(data);
      } else {
        const data = await transformDataForChart(dailyRates, dateRange, selectedPartners);
        setChartData(data);
      }
      
      setHasCompared(true);
    } catch (error) {
      console.error("Erreur lors de la comparaison:", error);
      toast.error("Impossible de récupérer les données pour la comparaison");
    } finally {
      setIsLoading(false);
    }
  };

  const differencesData = calculateDifferences(chartData, selectedPartners);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Comparaison des tarifs</h1>
      
      <ComparisonForm 
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedPartners={selectedPartners}
        setSelectedPartners={setSelectedPartners}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        onCompare={handleCompare}
        isLoading={isLoading}
        allPartners={allPartners}
        allPlans={allPlans}
      />

      {hasCompared && (
        <div className="space-y-6">
          <Tabs defaultValue="visualization" className="w-full">
            <TabsList>
              <TabsTrigger value="visualization">Visualisation</TabsTrigger>
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
              <TabsTrigger value="data">Données</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualization" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Évolution des tarifs ({dateRange.from ? format(dateRange.from, "d MMM", { locale: fr }) : ""} - {dateRange.to ? format(dateRange.to, "d MMM yyyy", { locale: fr }) : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartVisualization 
                    chartData={chartData}
                    comparisonMode={comparisonMode}
                    selectedPartners={selectedPartners}
                    dateRange={dateRange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des différences</CardTitle>
                </CardHeader>
                <CardContent>
                  {differencesData.length > 0 ? (
                    <DifferenceAnalysis 
                      differencesData={differencesData}
                      chartData={chartData}
                      selectedPartners={selectedPartners}
                    />
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Sélectionnez au moins deux plans tarifaires pour voir l'analyse des différences.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="data" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Données brutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    chartData={chartData}
                    selectedPartners={selectedPartners}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default TariffComparison;
