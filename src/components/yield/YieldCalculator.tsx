
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
} from "@/services/yieldService";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

type CompetitorHotel = {
  name: string;
  data: { date: string; price: number }[];
};

const YieldCalculator = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date()
  });
  const [occupancyRate, setOccupancyRate] = useState<string>('');
  const [competitorPrice, setCompetitorPrice] = useState<string>('');
  const [optimizedPrice, setOptimizedPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [calculationMode, setCalculationMode] = useState<'single' | 'range'>('single');
  const [competitors, setCompetitors] = useState<CompetitorHotel[]>([]);
  const [newCompetitorName, setNewCompetitorName] = useState<string>('');
  const [occupancyData, setOccupancyData] = useState<{ date: string; rate: number }[]>([]);

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

  // Gestion des fichiers CSV pour les hôtels concurrents
  const handleCompetitorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newCompetitorName) {
      toast.error("Veuillez entrer un nom pour l'hôtel concurrent");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const parsedData = parseCSV(csvData);
        
        if (competitors.length >= 5) {
          toast.error("Vous ne pouvez ajouter que 5 hôtels concurrents maximum");
          return;
        }
        
        setCompetitors([...competitors, {
          name: newCompetitorName,
          data: parsedData
        }]);
        
        setNewCompetitorName('');
        toast.success(`Données de l'hôtel ${newCompetitorName} importées avec succès`);
      } catch (error) {
        toast.error("Erreur lors de l'analyse du fichier CSV");
        console.error(error);
      }
    };
    
    reader.readAsText(file);
  };

  // Gestion des fichiers CSV pour les taux d'occupation
  const handleOccupancyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const parsedData = parseOccupancyCSV(csvData);
        
        setOccupancyData(parsedData);
        toast.success("Données d'occupation importées avec succès");
      } catch (error) {
        toast.error("Erreur lors de l'analyse du fichier CSV");
        console.error(error);
      }
    };
    
    reader.readAsText(file);
  };

  // Parser un fichier CSV au format date,prix
  const parseCSV = (csvText: string): { date: string; price: number }[] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const [dateStr, priceStr] = line.split(',');
      return {
        date: dateStr.trim(),
        price: parseFloat(priceStr.trim())
      };
    });
  };

  // Parser un fichier CSV au format date,taux_occupation
  const parseOccupancyCSV = (csvText: string): { date: string; rate: number }[] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const [dateStr, rateStr] = line.split(',');
      return {
        date: dateStr.trim(),
        rate: parseFloat(rateStr.trim())
      };
    });
  };

  const removeCompetitor = (index: number) => {
    const newCompetitors = [...competitors];
    newCompetitors.splice(index, 1);
    setCompetitors(newCompetitors);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Calculateur de Yield</CardTitle>
        <CardDescription>
          Calculez le prix optimal en fonction du taux d'occupation et des prix concurrents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={calculationMode} onValueChange={(v) => setCalculationMode(v as 'single' | 'range')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Date unique</TabsTrigger>
            <TabsTrigger value="range">Période</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="range" className="space-y-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Hôtels concurrents</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nom de l'hôtel concurrent"
                  value={newCompetitorName}
                  onChange={(e) => setNewCompetitorName(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={handleCompetitorFileUpload}
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Format: date,prix</p>
              </div>
            </div>
            
            {competitors.length > 0 && (
              <div className="border rounded-md p-2 mt-4">
                <p className="font-medium mb-2">Hôtels concurrents ({competitors.length}/5)</p>
                <ul className="space-y-1">
                  {competitors.map((hotel, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{hotel.name} ({hotel.data.length} entrées)</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeCompetitor(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Taux d'occupation</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="occupancy"
                  type="number"
                  min="0"
                  max="100"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(e.target.value)}
                  placeholder="Taux d'occupation (0-100)"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={handleOccupancyFileUpload}
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Format: date,taux_occupation</p>
              </div>
            </div>
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
              placeholder="Prix médian des concurrents"
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
        </div>
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
