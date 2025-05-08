
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";

interface CalculationResult {
  nightlyRates: { date: Date; rate: number }[];
  totalRate: number;
  averageRate: number;
  discount: number;
  totalAfterDiscount: number;
}

interface TariffCalculatorResultsProps {
  calculationResult: CalculationResult | null;
  discount: number;
}

const TariffCalculatorResults: React.FC<TariffCalculatorResultsProps> = ({
  calculationResult,
  discount,
}) => {
  return (
    <Card className="lg:col-span-2 glass-effect">
      <CardHeader>
        <CardTitle>Résultats</CardTitle>
        <CardDescription>
          Détail du calcul et simulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calculationResult ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-card/50 backdrop-blur-sm">
              <div className="bg-muted/30 px-4 py-2 rounded-t-lg border-b border-white/10">
                <h3 className="font-medium">Détail par nuit</h3>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto tariff-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium">Date</th>
                      <th className="text-right font-medium">Tarif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResult.nightlyRates.map((night, index) => (
                      <tr key={index} className="border-b border-white/10 last:border-0">
                        <td className="py-2">
                          {format(night.date, "eeee d MMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {night.rate} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-md bg-card/50 backdrop-blur-sm border border-white/10">
                <p className="text-sm text-muted-foreground">Tarif moyen par nuit</p>
                <p className="text-2xl font-bold text-primary">
                  {calculationResult.averageRate} €
                </p>
              </div>
              <div className="space-y-2 p-4 rounded-md bg-card/50 backdrop-blur-sm border border-white/10">
                <p className="text-sm text-muted-foreground">Tarif total</p>
                <p className="text-2xl font-bold text-primary">
                  {calculationResult.totalRate} €
                </p>
              </div>
            </div>

            {calculationResult.discount > 0 && (
              <div className="rounded-lg border border-tariff-green/30 bg-tariff-green/10 p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-tariff-green">
                      Remise appliquée ({discount}%)
                    </p>
                    <p className="text-lg font-bold">
                      -{calculationResult.discount} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total après remise</p>
                    <p className="text-xl font-bold">
                      {calculationResult.totalAfterDiscount} €
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" className="glass-effect">
                Enregistrer
              </Button>
              <Button variant="outline" className="glass-effect">
                Exporter en PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Aucun calcul effectué
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Remplissez les champs et cliquez sur le bouton "Calculer" 
              pour voir les résultats de votre simulation tarifaire.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TariffCalculatorResults;
