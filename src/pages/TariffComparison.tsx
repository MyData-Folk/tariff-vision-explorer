
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CalendarDays, ChevronDown, Plus, X } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import { fetchPlans, fetchPartners } from "@/services/partnerService";
import { fetchDailyBaseRates } from "@/services/rateService";
import { Plan, Partner, DailyRate } from "@/services/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface SelectedPartner {
  partnerId: string;
  partnerName: string;
  planId: string;
  planName: string;
}

// Fonction pour transformer les données de la base en données pour le graphique
const transformDataForChart = (
  baseRates: any[], 
  dateRange: DateRange, 
  selectedPartners: SelectedPartner[]
): ChartData[] => {
  if (!dateRange.from || !dateRange.to || selectedPartners.length === 0) {
    return [];
  }

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
    "standard": 1.00,
    "flexible": 1.15,
    "discount": 0.90,
    "premium": 1.25
  };
  
  // Pour chaque jour dans la plage de dates
  let currentDate = new Date(dateRange.from);
  const lastDate = new Date(dateRange.to);
  
  while (currentDate <= lastDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const entry: ChartData = { date: dateStr };
    
    // Trouver les taux pour cette date
    const rates = ratesMap.get(dateStr);
    
    if (rates) {
      // Calculer les tarifs pour chaque partenaire sélectionné
      selectedPartners.forEach(partnerData => {
        // Déterminer le taux de base à utiliser (ota ou travco)
        // Par défaut utiliser ota_rate
        const baseRate = rates.ota_rate;
        
        // Déterminer le multiplicateur en fonction du plan (code simplifié)
        const planCode = partnerData.planName.toLowerCase();
        let multiplier = 1;
        
        for (const [planKey, planValue] of Object.entries(planMultipliers)) {
          if (planCode.includes(planKey)) {
            multiplier = planValue;
            break;
          }
        }
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        // Convertir en nombre et arrondir
        entry[displayName] = Math.round(Number(baseRate) * multiplier);
      });
      
      data.push(entry);
    } else {
      // Si nous n'avons pas de données pour cette date, utiliser des estimations
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const baseRate = isWeekend ? 140 : 120; // Estimation
      
      selectedPartners.forEach(partnerData => {
        const planCode = partnerData.planName.toLowerCase();
        let multiplier = 1;
        
        for (const [planKey, planValue] of Object.entries(planMultipliers)) {
          if (planCode.includes(planKey)) {
            multiplier = planValue;
            break;
          }
        }
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        entry[displayName] = Math.round(baseRate * multiplier);
      });
      
      data.push(entry);
    }
    
    // Passer au jour suivant
    currentDate = addDays(currentDate, 1);
  }
  
  return data;
};

const comparisonModes = ["line", "bar", "table", "both"];
const comparisonModeLabels = {
  line: "Ligne",
  bar: "Barres",
  table: "Tableau",
  both: "Les deux"
};

const TariffComparison = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [comparisonMode, setComparisonMode] = useState<string>("line");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<SelectedPartner[]>([{
    partnerId: "",
    partnerName: "",
    planId: "",
    planName: ""
  }]);
  const [hasCompared, setHasCompared] = useState(false);
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
        
        if (partners.length > 0) {
          setSelectedPartners([
            {
              partnerId: partners[0].id,
              partnerName: partners[0].name,
              planId: "",
              planName: ""
            }
          ]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données initiales:", error);
        toast.error("Impossible de charger les données initiales");
      }
    };
    
    loadInitialData();
  }, []);
  
  const addPartner = () => {
    if (selectedPartners.length < 3) {
      setSelectedPartners([...selectedPartners, {
        partnerId: "",
        partnerName: "",
        planId: "",
        planName: ""
      }]);
    } else {
      toast.warning("Vous ne pouvez comparer que 3 partenaires maximum");
    }
  };
  
  const removePartner = (index: number) => {
    if (selectedPartners.length > 1) {
      const newPartners = [...selectedPartners];
      newPartners.splice(index, 1);
      setSelectedPartners(newPartners);
    }
  };
  
  const updatePartner = (index: number, field: keyof SelectedPartner, value: string) => {
    const newPartners = [...selectedPartners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    
    // Si c'est l'ID du partenaire qui change, mettons à jour aussi le nom
    if (field === 'partnerId') {
      const partner = allPartners.find(p => p.id === value);
      if (partner) {
        newPartners[index].partnerName = partner.name;
      }
    }
    
    // Si c'est l'ID du plan qui change, mettons à jour aussi le nom
    if (field === 'planId') {
      const plan = allPlans.find(p => p.id === value);
      if (plan) {
        newPartners[index].planName = plan.description;
      }
    }
    
    setSelectedPartners(newPartners);
  };
  
  const getPlansForPartner = (partnerId: string) => {
    if (!partnerId) return [];
    return allPlans.filter(plan => {
      // Logique simplifiée pour l'association des plans aux partenaires
      // En pratique, vous pourriez avoir besoin d'une requête spécifique
      return true; // Pour l'instant, retourner tous les plans
    });
  };

  const handleCompare = async () => {
    // Vérifier que toutes les sélections sont complètes
    const isSelectionComplete = selectedPartners.every(
      partner => partner.partnerId && partner.planId
    );
    
    if (!isSelectionComplete) {
      toast.error("Veuillez sélectionner un partenaire et un plan pour chaque comparaison");
      return;
    }
    
    if (!dateRange.from || !dateRange.to) {
      toast.error("Veuillez sélectionner une plage de dates");
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedStartDate = format(dateRange.from, "yyyy-MM-dd");
      const formattedEndDate = format(dateRange.to, "yyyy-MM-dd");
      
      const dailyRates = await fetchDailyBaseRates(formattedStartDate, formattedEndDate);
      
      if (dailyRates.length === 0) {
        toast.warning("Pas de données disponibles pour cette période");
        const data = transformDataForChart([], dateRange, selectedPartners);
        setChartData(data);
      } else {
        const data = transformDataForChart(dailyRates, dateRange, selectedPartners);
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
    if (!chartData.length || selectedPartners.length < 2) return [];

    const firstPartner = `${selectedPartners[0].partnerName} - ${selectedPartners[0].planName}`;
    
    const differences = selectedPartners.slice(1).map(partner => {
      const currentPartner = `${partner.partnerName} - ${partner.planName}`;
      
      // Calculate average difference
      const avgDiff = chartData.reduce((sum, day) => {
        return sum + (Number(day[currentPartner]) - Number(day[firstPartner]));
      }, 0) / chartData.length;

      // Calculate percentage difference
      const avgFirstPartner = chartData.reduce((sum, day) => {
        return sum + Number(day[firstPartner]);
      }, 0) / chartData.length;
      
      const percentDiff = (avgDiff / avgFirstPartner) * 100;

      const isPositive = avgDiff > 0;

      return {
        plan: currentPartner,
        baselinePlan: firstPartner,
        averageDifference: Math.abs(Math.round(avgDiff)),
        percentDifference: Math.abs(percentDiff.toFixed(1)),
        isAbove: isPositive,
      };
    });

    return differences;
  };
  
  const differencesData = calculateDifferences();

  // Calculate an array of selected partner display names for use in the charts and tables
  const getSelectedPlanNames = () => {
    return selectedPartners
      .filter(p => p.partnerId && p.planName)
      .map(p => `${p.partnerName} - ${p.planName}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Comparaison des tarifs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de comparaison</CardTitle>
          <CardDescription>
            Sélectionnez une période et des partenaires à comparer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sélection de la période */}
            <div className="space-y-2">
              <label className="font-medium">Période</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
            
            {/* Sélection des partenaires */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Partenaires et plans</label>
                {selectedPartners.length < 3 && (
                  <Button 
                    onClick={addPartner} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Ajouter un partenaire
                  </Button>
                )}
              </div>
              
              {selectedPartners.map((partner, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border p-3 rounded-md bg-card/50">
                  <div className="md:col-span-5">
                    <label className="text-sm mb-1 block">Partenaire {index + 1}</label>
                    <select
                      value={partner.partnerId}
                      onChange={(e) => updatePartner(index, 'partnerId', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Sélectionner un partenaire</option>
                      {allPartners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-5">
                    <label className="text-sm mb-1 block">Plan tarifaire</label>
                    <select
                      value={partner.planId}
                      onChange={(e) => updatePartner(index, 'planId', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      disabled={!partner.partnerId}
                    >
                      <option value="">Sélectionner un plan</option>
                      {getPlansForPartner(partner.partnerId).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {index > 0 && (
                    <div className="md:col-span-2 flex justify-end">
                      <Button 
                        onClick={() => removePartner(index)} 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Mode de visualisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <label className="font-medium">Mode de visualisation</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {comparisonModeLabels[comparisonMode as keyof typeof comparisonModeLabels]}
                      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuRadioGroup value={comparisonMode} onValueChange={setComparisonMode}>
                      {comparisonModes.map((mode) => (
                        <DropdownMenuRadioItem key={mode} value={mode}>
                          {comparisonModeLabels[mode as keyof typeof comparisonModeLabels]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-end">
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
                    Évolution des tarifs ({dateRange.from ? format(dateRange.from, "d MMM", { locale: fr }) : ""} - {dateRange.to ? format(dateRange.to, "d MMM yyyy", { locale: fr }) : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(comparisonMode === "line" || comparisonMode === "both") && (
                    <div className="h-[400px] w-full mb-6">
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
                          {selectedPartners.map((partner, index) => {
                            const displayName = `${partner.partnerName} - ${partner.planName}`;
                            if (!displayName.includes("undefined")) {
                              return (
                                <Line
                                  key={displayName}
                                  type="monotone"
                                  dataKey={displayName}
                                  stroke={["#1E40AF", "#10B981", "#8B5CF6"][index % 3]}
                                  strokeWidth={2}
                                  activeDot={{ r: 6 }}
                                  name={displayName}
                                />
                              );
                            }
                            return null;
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {(comparisonMode === "bar" || comparisonMode === "both") && (
                    <div className="h-[400px] w-full mb-6">
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
                          {selectedPartners.map((partner, index) => {
                            const displayName = `${partner.partnerName} - ${partner.planName}`;
                            if (!displayName.includes("undefined")) {
                              return (
                                <Bar 
                                  key={displayName}
                                  dataKey={displayName} 
                                  fill={["#1E40AF", "#10B981", "#8B5CF6"][index % 3]}
                                  name={displayName}
                                />
                              );
                            }
                            return null;
                          })}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {(comparisonMode === "table" || comparisonMode === "both") && (
                    <div className="overflow-x-auto tariff-scrollbar">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border px-4 py-2 text-left">Date</th>
                            {selectedPartners.map((partner, index) => {
                              const displayName = `${partner.partnerName} - ${partner.planName}`;
                              if (!displayName.includes("undefined")) {
                                return (
                                  <th key={index} className="border px-4 py-2 text-left">
                                    {displayName}
                                  </th>
                                );
                              }
                              return null;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                              <td className="border px-4 py-2">
                                {format(new Date(row.date), "eeee d MMM", { locale: fr })}
                              </td>
                              {selectedPartners.map((partner, index) => {
                                const displayName = `${partner.partnerName} - ${partner.planName}`;
                                if (!displayName.includes("undefined")) {
                                  return (
                                    <td key={index} className="border px-4 py-2 font-medium">
                                      {row[displayName]} €
                                    </td>
                                  );
                                }
                                return null;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                                  data={getSelectedPlanNames().map((plan) => ({
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
                                    {getSelectedPlanNames().map((plan, index) => (
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
                              Sur la période analysée, le plan <strong>{selectedPartners[0].partnerName} - {selectedPartners[0].planName}</strong> a servi
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
                            {selectedPartners.length > 2 && (
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
                          {getSelectedPlanNames().map((plan) => (
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
                            {getSelectedPlanNames().map((plan) => (
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
