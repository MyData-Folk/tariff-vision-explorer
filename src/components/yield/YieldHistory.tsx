
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice, downloadCSV } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseISODate } from "@/lib/utils";
import { CompetitorPrice, OccupancyRate, OptimizedPrice } from "@/services/supabaseService";
import { AlertTriangle } from "lucide-react";

interface YieldHistoryTableProps {
  occupancyRates: OccupancyRate[];
  competitorPrices: CompetitorPrice[];
  optimizedPrices: OptimizedPrice[];
  isLoading: boolean;
}

interface HistoryData {
  date: string;
  formattedDate: string;
  occupancyRate: number;
  competitorPrice: number;
  optimizedPrice: number;
  difference: number;
}

const YieldHistory: React.FC<YieldHistoryTableProps> = ({ 
  occupancyRates, 
  competitorPrices, 
  optimizedPrices,
  isLoading 
}) => {
  // Fusionner les données des trois tableaux
  const historyData: HistoryData[] = React.useMemo(() => {
    // Créer une map pour faciliter la fusion des données
    const dataMap = new Map<string, Partial<HistoryData>>();
    
    // Ajouter les taux d'occupation
    occupancyRates.forEach(item => {
      const date = item.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, { 
          date, 
          formattedDate: format(parseISODate(date), "dd MMMM yyyy", { locale: fr }) 
        });
      }
      dataMap.get(date)!.occupancyRate = item.rate;
    });
    
    // Ajouter les prix des concurrents
    competitorPrices.forEach(item => {
      const date = item.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, { 
          date, 
          formattedDate: format(parseISODate(date), "dd MMMM yyyy", { locale: fr }) 
        });
      }
      dataMap.get(date)!.competitorPrice = item.price;
    });
    
    // Ajouter les prix optimisés
    optimizedPrices.forEach(item => {
      const date = item.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, { 
          date, 
          formattedDate: format(parseISODate(date), "dd MMMM yyyy", { locale: fr }) 
        });
      }
      dataMap.get(date)!.optimizedPrice = item.calculated_price;
    });
    
    // Convertir la map en tableau et trier par date
    return Array.from(dataMap.values())
      .filter(item => 
        item.occupancyRate !== undefined && 
        item.competitorPrice !== undefined && 
        item.optimizedPrice !== undefined
      )
      .map(item => ({
        date: item.date!,
        formattedDate: item.formattedDate!,
        occupancyRate: item.occupancyRate!,
        competitorPrice: item.competitorPrice!,
        optimizedPrice: item.optimizedPrice!,
        difference: item.optimizedPrice! - item.competitorPrice!
      }))
      .sort((a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime()); // Tri par date décroissante
  }, [occupancyRates, competitorPrices, optimizedPrices]);

  // Export CSV
  const handleExportCSV = () => {
    const exportData = historyData.map(item => ({
      Date: item.formattedDate,
      "Taux d'occupation (%)": item.occupancyRate,
      "Prix concurrent (€)": item.competitorPrice,
      "Prix optimisé (€)": item.optimizedPrice,
      "Différence (€)": item.difference
    }));
    
    downloadCSV(exportData, `tarifs-optimises-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des prix</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chargement en cours...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historique des prix</CardTitle>
          <CardDescription>Historique des calculs de prix optimisés</CardDescription>
        </div>
        <Button 
          onClick={handleExportCSV} 
          disabled={historyData.length === 0}
          variant="outline"
          size="sm"
        >
          Exporter CSV
        </Button>
      </CardHeader>
      <CardContent>
        {historyData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aucune donnée historique disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Taux d'occupation</TableHead>
                  <TableHead className="text-right">Prix concurrent</TableHead>
                  <TableHead className="text-right">Prix optimisé</TableHead>
                  <TableHead className="text-right">Différence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((item) => (
                  <TableRow key={item.date}>
                    <TableCell>{item.formattedDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.occupancyRate < 60 && (
                          <AlertTriangle className="h-4 w-4 text-tariff-red" />
                        )}
                        {`${item.occupancyRate.toFixed(1)}%`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(item.competitorPrice)}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.optimizedPrice)}</TableCell>
                    <TableCell className={`text-right ${item.difference < 0 ? 'text-tariff-red' : 'text-tariff-green'}`}>
                      {formatPrice(item.difference)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YieldHistory;
