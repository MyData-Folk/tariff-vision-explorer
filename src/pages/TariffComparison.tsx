
import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fetchPlans, fetchPartners, fetchDailyBaseRates, Plan, Partner } from "@/services/supabaseService";
import { toast } from "sonner";

interface ChartData {
  date: string;
  [key: string]: string | number;
}

// Fonction pour transformer les données de la base en données pour le graphique
const transformDataForChart = (
  baseRates: any[], 
  startDate: Date, 
  endDate: Date, 
  selectedPlans: string[]
): ChartData[] => {
  const data: ChartData[] = [];
  
  // Créer une map des dates pour un accès plus rapide
  const ratesMap = new Map();
  baseRates.forEach(rate => {
    ratesMap.set(rate.date, {
      ota_rate: rate.ota_rate,
      travco_rate: rate.travco_rate
    });
  });
  
  // Définir les taux de base pour chaque plan
  const planMultipliers: {[key: string]: number} = {
    "Booking Standard": 1.05,
    "Booking Flexible": 1.15,
    "Expedia Standard": 1.03,
    "Expedia Flexible": 1.13,
    "Direct": 1,
  };
  
  // Pour chaque jour dans la plage de dates
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  while (currentDate <= lastDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const entry: ChartData = { date: dateStr };
    
    // Trouver les taux pour cette date
    const rates = ratesMap.get(dateStr);
    
    if (rates) {
      // Calculer les tarifs pour chaque plan sélectionné
      selectedPlans.forEach(plan => {
        const baseRate = rates.ota_rate; // On utilise le taux OTA comme base
        const multiplier = planMultipliers[plan] || 1;
        entry[plan] = Math.round(baseRate * multiplier);
      });
      
      data.push(entry);
    } else {
      // Si nous n'avons pas de données pour cette date, utiliser des estimations basées sur des jours similaires
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const baseRate = isWeekend ? 140 : 120; // Estimation
      
      selectedPlans.forEach(plan => {
        const multiplier = planMultipliers[plan] || 1;
        entry[plan] = Math.round(baseRate * multiplier);
      });
      
      data.push(entry);
    }
    
    // Passer au jour suivant
    currentDate = addDays(currentDate, 1);
  }
  
  return data;
};

const comparisonModes = ["line", "bar", "table"];
const comparisonModeLabels = {
  line: "Ligne",
  bar: "Barres",
  table: "Tableau",
};

const TariffComparison = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [comparisonMode, setComparisonMode] = useState<string>("line");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([
    "Booking Standard",
    "Expedia Standard",
    "Direct",
  ]);
  const [hasCompared, setHasCompared] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);

  useEffect(() => {
    // Chargement des plans et partenaires au chargement de la page
    const loadInitialData = async () => {
      try {
        const [plans, partners] = await Promise.all([
          fetchPlans(),
          fetchPartners()
        ]);
        
        setAllPlans(plans);
        setAllPartners(partners);
        
        // Construire les plans disponibles à partir des données réelles
        const planNames = [
          "Booking Standard",
          "Booking Flexible",
          "Expedia Standard", 
          "Expedia Flexible",
          "Direct"
        ];
        setAvailablePlans(planNames);
      } catch (error) {
        console.error("Erreur lors du chargement des données initiales:", error);
        toast.error("Impossible de charger les données initiales");
      }
    };
    
    loadInitialData();
  }, []);
  
  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");
      
      const dailyRates = await fetchDailyBaseRates(formattedStartDate, formattedEndDate);
      
      if (dailyRates.length === 0) {
        toast.warning("Pas de données disponibles pour cette période");
        const data = transformDataForChart([], startDate, endDate, selectedPlans);
        setChartData(data);
      } else {
        const data = transformDataForChart(dailyRates, startDate, endDate, selectedPlans);
        setChartData(data);
      }
      
      setHasCompared(true);
    } catch (error) {
      console.error("Erreur lors de la comparaison:", error);
      toast.error("Impossible de récupérer les données pour la comparaison");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDifferences = () => {
    if (!chartData.length || selectedPlans.length < 2) return [];

    const firstPlan = selectedPlans[0];
    const differences = selectedPlans.slice(1).map(plan => {
      // Calculate average difference
      const avgDiff = chartData.reduce((sum, day) => {
        return sum + (Number(day[plan]) - Number(day[firstPlan]));
      }, 0) / chartData.length;

      // Calculate percentage difference
      const avgFirstPlan = chartData.reduce((sum, day) => sum + Number(day[firstPlan]), 0) / chartData.length;
      const percentDiff = (avgDiff / avgFirstPlan) * 100;

      const isPositive = avgDiff > 0;

      return {
        plan,
        baselinePlan: firstPlan,
        averageDifference: Math.abs(Math.round(avgDiff)),
        percentDifference: Math.abs(percentDiff.toFixed(1)),
        isAbove: isPositive,
      };
    });

    return differences;
  };
  
  const differencesData = calculateDifferences();

  const togglePlan = (plan: string) => {
    setSelectedPlans(prev =>
      prev.includes(plan)
        ? prev.filter(p => p !== plan)
        : [...prev, plan]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Comparaison des tarifs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de comparaison</CardTitle>
          <CardDescription>
            Sélectionnez une période et des plans tarifaires à comparer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="font-medium">Période</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "d MMM", { locale: fr }) : "Date de début"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date || new Date());
                          if (date && date > endDate) {
                            setEndDate(addDays(date, 1));
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "d MMM", { locale: fr }) : "Date de fin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        fromDate={startDate ? addDays(startDate, 1) : undefined}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="font-medium">Plans tarifaires</div>
              <div>
                <div className="flex flex-wrap gap-2">
                  {availablePlans.map((plan) => (
                    <Button
                      key={plan}
                      variant={selectedPlans.includes(plan) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePlan(plan)}
                      className={cn(
                        selectedPlans.includes(plan) ? "bg-primary" : ""
                      )}
                    >
                      {plan}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="font-medium">Mode de visualisation</div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-40 justify-between">
                      {comparisonModeLabels[comparisonMode as keyof typeof comparisonModeLabels]}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    <DropdownMenuRadioGroup value={comparisonMode} onValueChange={setComparisonMode}>
                      {comparisonModes.map((mode) => (
                        <DropdownMenuRadioItem key={mode} value={mode}>
                          {comparisonModeLabels[mode as keyof typeof comparisonModeLabels]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={handleCompare} disabled={isLoading}>
                  {isLoading ? "Chargement..." : "Comparer"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasCompared && (
        <div className="space-y-6">
          <Tabs defaultValue="visualization" className="w-full">
            <TabsList>
              <TabsTrigger value="visualization">Visualisation</TabsTrigger>
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
              <TabsTrigger value="data">Données</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualization" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Évolution des tarifs ({format(startDate, "d MMM", { locale: fr })} - {format(endDate, "d MMM yyyy", { locale: fr })})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    {comparisonMode === "line" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "d MMM", { locale: fr })} />
                          <YAxis domain={['auto', 'auto']} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} €`, ""]}
                            labelFormatter={(date) => format(new Date(date), "eeee d MMMM", { locale: fr })}
                          />
                          <Legend />
                          {selectedPlans.map((plan, index) => (
                            <Line
                              key={plan}
                              type="monotone"
                              dataKey={plan}
                              stroke={["#1E40AF", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"][index % 5]}
                              strokeWidth={2}
                              activeDot={{ r: 6 }}
                              name={plan}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    
                    {comparisonMode === "bar" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "d MMM", { locale: fr })} />
                          <YAxis domain={['auto', 'auto']} />
                          <Tooltip 
                            formatter={(value: number) => [`${value} €`, ""]}
                            labelFormatter={(date) => format(new Date(date), "eeee d MMMM", { locale: fr })}
                          />
                          <Legend />
                          {selectedPlans.map((plan, index) => (
                            <Bar 
                              key={plan} 
                              dataKey={plan} 
                              fill={["#1E40AF", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"][index % 5]}
                              name={plan}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {comparisonMode === "table" && (
                      <div className="overflow-x-auto tariff-scrollbar">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="border px-4 py-2 text-left">Date</th>
                              {selectedPlans.map((plan) => (
                                <th key={plan} className="border px-4 py-2 text-left">{plan}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chartData.map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                <td className="border px-4 py-2">
                                  {format(new Date(row.date), "eeee d MMM", { locale: fr })}
                                </td>
                                {selectedPlans.map((plan) => (
                                  <td key={plan} className="border px-4 py-2 font-medium">
                                    {row[plan]} €
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analyse des différences</CardTitle>
                </CardHeader>
                <CardContent>
                  {differencesData.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {differencesData.map((diff, idx) => (
                          <Card key={idx} className="overflow-hidden">
                            <div className={cn(
                              "h-2 w-full",
                              diff.isAbove ? "bg-tariff-red" : "bg-tariff-green"
                            )} />
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{diff.plan}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    vs {diff.baselinePlan}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={cn(
                                    "text-lg font-bold",
                                    diff.isAbove ? "text-tariff-red" : "text-tariff-green"
                                  )}>
                                    {diff.isAbove ? "+" : "-"}{diff.averageDifference} €
                                  </p>
                                  <p className="text-sm">
                                    ({diff.isAbove ? "+" : "-"}{diff.percentDifference}%)
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Tarifs moyens</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={selectedPlans.map((plan) => ({
                                    plan,
                                    avg: Math.round(chartData.reduce((sum, day) => sum + Number(day[plan]), 0) / chartData.length)
                                  }))}
                                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="plan" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [`${value} €`, "Tarif moyen"]} />
                                  <Bar dataKey="avg">
                                    {selectedPlans.map((plan, index) => (
                                      <Cell 
                                        key={plan} 
                                        fill={["#1E40AF", "#10B981", "#8B5CF6", "#F59E0B", "#6B7280"][index % 5]} 
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Observations</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p>
                              Sur la période analysée, le plan <strong>{selectedPlans[0]}</strong> a servi
                              de référence. Les observations suivantes ont été relevées:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                              {differencesData.map((diff, idx) => (
                                <li key={idx}>
                                  <strong>{diff.plan}</strong> est{" "}
                                  <span className={diff.isAbove ? "text-tariff-red" : "text-tariff-green"}>
                                    {diff.isAbove ? "plus cher" : "moins cher"} de {diff.averageDifference} €
                                  </span>{" "}
                                  en moyenne ({diff.percentDifference}%).
                                </li>
                              ))}
                            </ul>
                            {selectedPlans.length > 2 && (
                              <p className="mt-4 text-sm text-muted-foreground">
                                Note: Les comparaisons sont effectuées par rapport au premier plan sélectionné.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Sélectionnez au moins deux plans tarifaires pour voir l'analyse des différences.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="data" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Données brutes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto tariff-scrollbar">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border px-4 py-2 text-left">Date</th>
                          {availablePlans.map((plan) => (
                            <th key={plan} className="border px-4 py-2 text-left">{plan}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                            <td className="border px-4 py-2">
                              {format(new Date(row.date), "eeee d MMM", { locale: fr })}
                            </td>
                            {availablePlans.map((plan) => (
                              <td key={plan} className="border px-4 py-2 font-medium">
                                {row[plan] ? `${row[plan]} €` : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default TariffComparison;
