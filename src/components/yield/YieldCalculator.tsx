
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveYieldData } from "@/services/yieldService";

const YieldCalculator = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [occupancyRate, setOccupancyRate] = useState<number>(75);
  const [competitorPrice, setCompetitorPrice] = useState<number>(150);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Fonction pour calculer le prix optimal
  const calculateOptimalPrice = async () => {
    setIsLoading(true);

    // Appliquer la règle de calcul selon le taux d'occupation
    let optimalPrice: number;
    if (occupancyRate >= 80) {
      // Demande forte: -5% du prix concurrent
      optimalPrice = competitorPrice * 0.95;
    } else if (occupancyRate >= 60) {
      // Demande moyenne: -15% du prix concurrent
      optimalPrice = competitorPrice * 0.85;
    } else {
      // Demande faible: -30% du prix concurrent
      optimalPrice = competitorPrice * 0.70;
    }

    // Arrondir le prix
    optimalPrice = Math.round(optimalPrice);
    setCalculatedPrice(optimalPrice);

    // Enregistrer le résultat dans la base de données
    try {
      await saveYieldData(
        new Date(date), 
        occupancyRate, 
        competitorPrice, 
        optimalPrice
      );
      
      toast({
        title: "Calcul enregistré",
        description: "Le prix optimal a été calculé et enregistré avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de l'enregistrement des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculateur de Yield</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupancy">Taux d'occupation (%)</Label>
          <Input
            id="occupancy"
            type="number"
            min="0"
            max="100"
            value={occupancyRate}
            onChange={(e) => setOccupancyRate(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="competitor-price">Prix concurrent (€)</Label>
          <Input
            id="competitor-price"
            type="number"
            min="0"
            value={competitorPrice}
            onChange={(e) => setCompetitorPrice(Number(e.target.value))}
          />
        </div>

        {calculatedPrice !== null && (
          <div className="rounded-md bg-primary/10 p-4 mt-4">
            <p className="text-sm font-medium mb-1">Prix optimal calculé:</p>
            <p className="text-2xl font-bold">{calculatedPrice} €</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={calculateOptimalPrice} disabled={isLoading} className="w-full">
          {isLoading ? "Calcul en cours..." : "Calculer le prix optimal"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default YieldCalculator;
