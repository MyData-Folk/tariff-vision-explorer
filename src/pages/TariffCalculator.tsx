
import React, { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
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
import { mockCategories, mockPartners, mockRatePlans } from "@/lib/mockData";

interface CalculationResult {
  nightlyRates: { date: Date; rate: number }[];
  totalRate: number;
  averageRate: number;
  discount: number;
  totalAfterDiscount: number;
}

const TariffCalculator = () => {
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(new Date());
  const [nights, setNights] = useState<number>(1);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const availablePlans = selectedPartner
    ? mockRatePlans.filter((plan) => plan.partnerId === selectedPartner)
    : [];

  const handleCalculate = () => {
    if (!arrivalDate || !selectedPlan || !selectedCategory) {
      return;
    }

    // Generate random nightly rates for demo purposes
    const baseRate = parseInt(selectedCategory) * 40 + 80; // Just a formula for demo
    const nightlyRates = Array.from({ length: nights }).map((_, index) => {
      const date = new Date(arrivalDate);
      date.setDate(date.getDate() + index);
      
      // Weekend rates are higher
      const isWeekend = [0, 6].includes(date.getDay());
      const adjustmentFactor = isWeekend ? 1.2 : 1;
      
      // Some randomness
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      return {
        date,
        rate: Math.round(baseRate * adjustmentFactor * randomFactor),
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
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Calcul des tarifs</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Définissez les paramètres pour calculer le tarif
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arrival-date">Date d'arrivée</Label>
              <Popover>
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
                    onSelect={setArrivalDate}
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un partenaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Partenaires</SelectLabel>
                    {mockPartners.map((partner) => (
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
                disabled={!selectedPartner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Plans disponibles</SelectLabel>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie de chambre</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    {mockCategories.map((category) => (
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
              className="w-full" 
              onClick={handleCalculate}
              disabled={!arrivalDate || !selectedPlan || !selectedCategory}
            >
              Calculer
            </Button>
          </CardFooter>
        </Card>

        {/* Results Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
            <CardDescription>
              Détail du calcul et simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculationResult ? (
              <div className="space-y-6">
                <div className="rounded-lg border">
                  <div className="bg-muted px-4 py-2 rounded-t-lg border-b">
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
                          <tr key={index} className="border-b last:border-0">
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
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tarif moyen par nuit</p>
                    <p className="text-2xl font-bold">
                      {calculationResult.averageRate} €
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tarif total</p>
                    <p className="text-2xl font-bold">
                      {calculationResult.totalRate} €
                    </p>
                  </div>
                </div>

                {calculationResult.discount > 0 && (
                  <div className="rounded-lg border border-tariff-green/30 bg-tariff-green/10 p-4">
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
                  <Button variant="outline">
                    Enregistrer
                  </Button>
                  <Button variant="outline">
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

export default TariffCalculator;
