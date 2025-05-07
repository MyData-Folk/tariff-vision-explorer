
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarDays, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalculationResult {
  nightlyRates: { date: Date; rate: number }[];
  totalRate: number;
  averageRate: number;
  discount: number;
  totalAfterDiscount: number;
}

interface Category {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  description: string;
  code: string;
}

const TariffCalculator = () => {
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [nights, setNights] = useState<number>(1);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // États pour stocker les données de la base
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données de la base au chargement de la page
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
          
        if (categoriesError) throw categoriesError;
        
        // Charger les partenaires
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');
          
        if (partnersError) throw partnersError;
        
        // Charger les plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*');
          
        if (plansError) throw plansError;
        
        setCategories(categoriesData || []);
        setPartners(partnersData || []);
        setPlans(plansData || []);
        
        // Définir des valeurs par défaut si disponibles
        if (partnersData && partnersData.length > 0) {
          setSelectedPartner(partnersData[0].id);
        }
        
        if (categoriesData && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Impossible de charger les données nécessaires");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtrer les plans disponibles pour le partenaire sélectionné
  const availablePlans = plans.filter(plan => {
    // Logique pour filtrer les plans par partenaire
    // À adapter selon votre structure de données
    return true; // Pour l'instant, montrer tous les plans
  });

  const handleCalculate = async () => {
    if (!arrivalDate || !selectedPlan || !selectedCategory) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      // On cherche d'abord s'il y a des tarifs de base pour les dates demandées
      const startDate = format(arrivalDate, 'yyyy-MM-dd');
      const endDate = format(
        new Date(arrivalDate.getTime() + (nights - 1) * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      
      const { data: baseRatesData, error: baseRatesError } = await supabase
        .from('daily_base_rates')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (baseRatesError) throw baseRatesError;
      
      // Générer les tarifs journaliers
      const baseRate = getBaseRateForCategory(selectedCategory);
      const nightlyRates = Array.from({ length: nights }).map((_, index) => {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + index);
        
        const dateString = format(date, 'yyyy-MM-dd');
        const baseRateForDay = baseRatesData?.find(rate => rate.date === dateString);
        
        // Weekend rates are higher
        const isWeekend = [0, 6].includes(date.getDay());
        const adjustmentFactor = isWeekend ? 1.2 : 1;
        
        // Utiliser le taux de base de la base de données si disponible, sinon utiliser la formule
        let rate;
        if (baseRateForDay) {
          rate = baseRateForDay.ota_rate; // ou un autre champ selon votre structure
        } else {
          // Randomness factor pour simuler des variations si pas de donnée disponible
          const randomFactor = 0.9 + Math.random() * 0.2;
          rate = Math.round(baseRate * adjustmentFactor * randomFactor);
        }
        
        return {
          date,
          rate,
        };
      });

      const totalRate = nightlyRates.reduce((sum, night) => sum + night.rate, 0);
      const averageRate = Math.round(totalRate / nights);
      const discountAmount = Math.round((totalRate * discount) / 100);
      const totalAfterDiscount = totalRate - discountAmount;

      setCalculationResult({
        nightlyRates,
        totalRate,
        averageRate,
        discount: discountAmount,
        totalAfterDiscount,
      });
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      toast.error("Impossible de calculer les tarifs");
    }
  };
  
  // Fonction pour obtenir le tarif de base en fonction de la catégorie
  const getBaseRateForCategory = (categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    // Logique simplifiée - dans un cas réel, vous récupéreriez cette valeur de la base ou d'un calcul complexe
    switch (category?.name.toLowerCase()) {
      case 'deluxe': return 145;
      case 'suite': return 210;
      case 'standard': return 115;
      case 'premium': return 175;
      default: return 120;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Calcul des tarifs</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1 glass-effect">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Définissez les paramètres pour calculer le tarif
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arrival-date">Date d'arrivée</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !arrivalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {arrivalDate ? (
                      format(arrivalDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={arrivalDate}
                    onSelect={(date) => {
                      setArrivalDate(date);
                      setIsCalendarOpen(false); // Fermer le calendrier après sélection
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nights">Nombre de nuits</Label>
              <Input
                id="nights"
                type="number"
                value={nights}
                min={1}
                onChange={(e) => setNights(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner">Partenaire</Label>
              <Select
                value={selectedPartner}
                onValueChange={(value) => {
                  setSelectedPartner(value);
                  setSelectedPlan("");
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un partenaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Partenaires</SelectLabel>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan tarifaire</Label>
              <Select
                value={selectedPlan}
                onValueChange={setSelectedPlan}
                disabled={!selectedPartner || isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Plans disponibles</SelectLabel>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.description}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie de chambre</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Remise (%)</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                min={0}
                max={100}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full btn-3d" 
              onClick={handleCalculate}
              disabled={!arrivalDate || !selectedPlan || !selectedCategory || isLoading}
            >
              Calculer
            </Button>
          </CardFooter>
        </Card>

        {/* Results Card */}
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
      </div>
    </div>
  );
};

// Importer le composant Calendar
import { Calendar } from "@/components/ui/calendar";

export default TariffCalculator;
