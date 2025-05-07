
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateToISO, formatPrice } from "@/lib/utils";
import { 
  upsertOccupancyRate, 
  upsertCompetitorPrice, 
  upsertOptimizedPrice, 
  calculateOptimizedPrice 
} from "@/services/supabaseService";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const YieldCalculator = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [occupancyRate, setOccupancyRate] = useState<string>('');
  const [competitorPrice, setCompetitorPrice] = useState<string>('');
  const [optimizedPrice, setOptimizedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  // Validation des entrées
  const isValidInput = (): boolean => {
    const occupancy = parseFloat(occupancyRate);
    const price = parseFloat(competitorPrice);

    if (isNaN(occupancy) || occupancy < 0 || occupancy > 100) {
      toast.error("Le taux d'occupation doit être entre 0 et 100%");
      return false;
    }

    if (isNaN(price) || price <= 0) {
      toast.error("Le prix médian des concurrents doit être un nombre positif");
      return false;
    }

    return true;
  };

  // Calculer et enregistrer le prix optimisé
  const calculateAndSavePrice = async () => {
    if (!isValidInput()) return;

    setIsLoading(true);

    try {
      const occupancy = parseFloat(occupancyRate);
      const price = parseFloat(competitorPrice);
      const optimal = calculateOptimizedPrice(occupancy, price);
      
      // Format the date to ISO format (YYYY-MM-DD)
      const dateStr = formatDateToISO(date);

      // Enregistrer les données dans Supabase
      await Promise.all([
        upsertOccupancyRate(dateStr, occupancy),
        upsertCompetitorPrice(dateStr, price),
        upsertOptimizedPrice(dateStr, optimal)
      ]);

      setOptimizedPrice(optimal);
      toast.success("Prix optimisé calculé et enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors du calcul ou de l'enregistrement des données:", error);
      toast.error("Une erreur est survenue lors du calcul ou de l'enregistrement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Fermer le calendrier après sélection d'une date
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setCalendarOpen(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Calculateur de Yield</CardTitle>
        <CardDescription>
          Calculez le prix optimal en fonction du taux d'occupation et des prix concurrents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                id="date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "P", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="occupancy">Taux d'occupation (%)</Label>
          <Input
            id="occupancy"
            type="number"
            min="0"
            max="100"
            value={occupancyRate}
            onChange={(e) => setOccupancyRate(e.target.value)}
            placeholder="Entrez le taux d'occupation (0-100)"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="competitor-price">Prix médian concurrents (€)</Label>
          <Input
            id="competitor-price"
            type="number"
            min="0"
            step="0.01"
            value={competitorPrice}
            onChange={(e) => setCompetitorPrice(e.target.value)}
            placeholder="Entrez le prix médian des concurrents"
          />
        </div>

        {optimizedPrice !== null && (
          <div className="p-4 border rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Prix optimisé :</p>
            <p className="text-2xl font-semibold text-primary">
              {formatPrice(optimizedPrice)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {parseFloat(occupancyRate) >= 80 
                ? "Demande forte (-5%)" 
                : parseFloat(occupancyRate) >= 60 
                ? "Demande moyenne (-15%)" 
                : "Demande faible (-30%)"}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={calculateAndSavePrice} 
          disabled={isLoading}
        >
          {isLoading ? "Calcul en cours..." : "Calculer le prix optimisé"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default YieldCalculator;
