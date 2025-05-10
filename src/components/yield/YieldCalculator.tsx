
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  saveYieldData, 
  calculateOptimizedPrice, 
  fetchPartners, 
  fetchPlansForPartner 
} from "@/services/yieldService";
import { Partner, Plan } from "@/services/types";

const YieldCalculator = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [occupancyRate, setOccupancyRate] = useState<number>(75);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Add partner and plan selection
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [competitorPrice, setCompetitorPrice] = useState<number>(150);

  // Fetch partners on component mount
  useEffect(() => {
    const loadPartners = async () => {
      try {
        const partnersData = await fetchPartners();
        setPartners(partnersData);

        // Select first partner by default if available
        if (partnersData.length > 0) {
          setSelectedPartnerId(partnersData[0].id);
        }
      } catch (error) {
        console.error("Error loading partners:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les partenaires",
          variant: "destructive",
        });
      }
    };

    loadPartners();
  }, [toast]);

  // Fetch plans when partner selection changes
  useEffect(() => {
    const loadPlans = async () => {
      if (selectedPartnerId) {
        try {
          const plansData = await fetchPlansForPartner(selectedPartnerId);
          setPlans(plansData);

          // Clear current plan selection and select first plan by default if available
          if (plansData.length > 0) {
            setSelectedPlanId(plansData[0].id);
          } else {
            setSelectedPlanId("");
          }
        } catch (error) {
          console.error("Error loading plans:", error);
          setPlans([]);
          setSelectedPlanId("");
        }
      } else {
        setPlans([]);
        setSelectedPlanId("");
      }
    };

    loadPlans();
  }, [selectedPartnerId]);

  // Fonction pour calculer le prix optimal
  const calculateOptimalPrice = async () => {
    setIsLoading(true);

    try {
      // Appliquer la règle de calcul selon le taux d'occupation
      const optimalPrice = calculateOptimizedPrice(occupancyRate, competitorPrice);
      setCalculatedPrice(optimalPrice);

      // Enregistrer le résultat dans la base de données
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
          <Label htmlFor="partner">Partenaire</Label>
          <Select
            value={selectedPartnerId}
            onValueChange={setSelectedPartnerId}
          >
            <SelectTrigger id="partner">
              <SelectValue placeholder="Sélectionner un partenaire" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan tarifaire</Label>
          <Select
            value={selectedPlanId}
            onValueChange={setSelectedPlanId}
            disabled={!selectedPartnerId || plans.length === 0}
          >
            <SelectTrigger id="plan">
              <SelectValue placeholder="Sélectionner un plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Button onClick={calculateOptimalPrice} disabled={isLoading || !selectedPartnerId || !selectedPlanId} className="w-full">
          {isLoading ? "Calcul en cours..." : "Calculer le prix optimal"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default YieldCalculator;
