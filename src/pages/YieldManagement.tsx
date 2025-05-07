
import React, { useState, useEffect } from "react";
import { 
  fetchOccupancyRates,
  fetchCompetitorPrices,
  fetchOptimizedPrices,
  OccupancyRate,
  CompetitorPrice,
  OptimizedPrice
} from "@/services";
import { DateRange } from "react-day-picker";
import { addMonths, startOfMonth, endOfMonth, subMonths } from "date-fns";
import YieldCalculator from "@/components/yield/YieldCalculator";
import YieldChart from "@/components/yield/YieldChart";
import YieldHistory from "@/components/yield/YieldHistory";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateToISO } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const YieldManagement = () => {
  // État pour la plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(addMonths(new Date(), 1))
  });

  // États pour les données
  const [occupancyRates, setOccupancyRates] = useState<OccupancyRate[]>([]);
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [optimizedPrices, setOptimizedPrices] = useState<OptimizedPrice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("calculator");

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange || !dateRange.from || !dateRange.to) return;

      setIsLoading(true);
      try {
        // Convertir les dates en format ISO (YYYY-MM-DD)
        const startDate = formatDateToISO(dateRange.from);
        const endDate = formatDateToISO(dateRange.to);

        // Récupérer les données en parallèle
        const [occupancyData, competitorData, optimizedData] = await Promise.all([
          fetchOccupancyRates(startDate, endDate),
          fetchCompetitorPrices(startDate, endDate),
          fetchOptimizedPrices(startDate, endDate)
        ]);

        setOccupancyRates(occupancyData);
        setCompetitorPrices(competitorData);
        setOptimizedPrices(optimizedData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Écouter les changements dans les données pour rafraîchir automatiquement
  // Cela est déclenché après chaque calcul de prix optimal
  const refreshData = async () => {
    if (!dateRange || !dateRange.from || !dateRange.to) return;

    try {
      // Convertir les dates en format ISO (YYYY-MM-DD)
      const startDate = formatDateToISO(dateRange.from);
      const endDate = formatDateToISO(dateRange.to);

      // Récupérer les données en parallèle
      const [occupancyData, competitorData, optimizedData] = await Promise.all([
        fetchOccupancyRates(startDate, endDate),
        fetchCompetitorPrices(startDate, endDate),
        fetchOptimizedPrices(startDate, endDate)
      ]);

      setOccupancyRates(occupancyData);
      setCompetitorPrices(competitorData);
      setOptimizedPrices(optimizedData);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Yield Management</h1>
        <DateRangePicker 
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calculator">Calculateur</TabsTrigger>
          <TabsTrigger value="chart">Graphique</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <YieldCalculator />
            <Card className="p-4 bg-muted/50">
              <h3 className="text-lg font-medium mb-3">Règles de calcul</h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>Taux d'occupation <strong>≥ 80%</strong>: Prix concurrent <strong>-5%</strong> (Demande forte)</li>
                <li>Taux d'occupation <strong>≥ 60%</strong>: Prix concurrent <strong>-15%</strong> (Demande moyenne)</li>
                <li>Taux d'occupation <strong>&lt; 60%</strong>: Prix concurrent <strong>-30%</strong> (Demande faible)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Les prix calculés sont automatiquement enregistrés dans la base de données et peuvent être consultés 
                dans l'onglet Historique ou visualisés dans l'onglet Graphique.
              </p>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="chart">
          <YieldChart 
            competitorPrices={competitorPrices} 
            optimizedPrices={optimizedPrices}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <YieldHistory 
            occupancyRates={occupancyRates}
            competitorPrices={competitorPrices}
            optimizedPrices={optimizedPrices}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YieldManagement;
