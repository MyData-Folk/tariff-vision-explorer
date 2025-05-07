import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseISODate, formatPrice } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CompetitorPrice, OptimizedPrice } from "@/services";

interface YieldChartProps {
  competitorPrices: CompetitorPrice[];
  optimizedPrices: OptimizedPrice[];
  isLoading: boolean;
}

const YieldChart: React.FC<YieldChartProps> = ({ competitorPrices, optimizedPrices, isLoading }) => {
  const chartData = useMemo(() => {
    // Créer une map pour faciliter la fusion des données
    const dataMap = new Map();
    
    // Ajouter les prix des concurrents
    competitorPrices.forEach(item => {
      const date = item.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      dataMap.get(date).competitorPrice = item.price;
    });
    
    // Ajouter les prix optimisés
    optimizedPrices.forEach(item => {
      const date = item.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      dataMap.get(date).optimizedPrice = item.calculated_price;
    });
    
    // Convertir la map en tableau et trier par date
    return Array.from(dataMap.values())
      .sort((a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime());
  }, [competitorPrices, optimizedPrices]);

  // Configuration du graphique
  const chartConfig = {
    optimizedPrice: {
      label: "Prix Optimisé",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))",
      }
    },
    competitorPrice: {
      label: "Prix Concurrents",
      theme: {
        light: "hsl(var(--muted-foreground))",
        dark: "hsl(var(--muted-foreground))",
      }
    },
  };

  const formatXAxis = (dateStr: string) => {
    // Formatter les dates pour l'axe X
    if (!dateStr) return '';
    const date = parseISODate(dateStr);
    return format(date, "dd/MM", { locale: fr });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des données...</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p>Chargement en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des prix</CardTitle>
          <CardDescription>
            Aucune donnée disponible. Veuillez calculer des prix pour voir le graphique.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Utilisez le calculateur pour générer des données</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des prix</CardTitle>
        <CardDescription>
          Évolution des prix optimisés par rapport aux prix concurrents
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              padding={{ left: 10, right: 10 }} 
            />
            <YAxis 
              tickFormatter={(value) => `${value}€`}
              domain={['auto', 'auto']}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (typeof value === 'number') {
                      return formatPrice(value);
                    }
                    return value;
                  }}
                  labelFormatter={(value) => {
                    if (typeof value === 'string') {
                      const date = parseISODate(value);
                      return format(date, "EEEE dd MMMM yyyy", { locale: fr });
                    }
                    return value;
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="optimizedPrice"
              name="optimizedPrice"
              stroke="var(--color-optimizedPrice)"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="competitorPrice"
              name="competitorPrice"
              stroke="var(--color-competitorPrice)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default YieldChart;
