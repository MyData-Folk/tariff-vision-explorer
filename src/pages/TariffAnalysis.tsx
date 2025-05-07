
import React, { useState, useEffect } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ChevronDown, ChartBar, ChartLine, LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { fetchCategories, fetchPartners, fetchDailyBaseRates, Category, Partner } from "@/services/supabaseService";
import { toast } from "sonner";

const DAYS_TO_SHOW = 30;

const TariffAnalysis = () => {
  const [analysisDate, setAnalysisDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("1");
  const [selectedPartner, setSelectedPartner] = useState<string>("1");
  const [selectedMetric, setSelectedMetric] = useState<string>("trend");
  const [chartView, setChartView] = useState<string>("area");
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  
  // Charger les catégories et partenaires au chargement
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [fetchedCategories, fetchedPartners] = await Promise.all([
          fetchCategories(),
          fetchPartners()
        ]);
        
        setCategories(fetchedCategories);
        setPartners(fetchedPartners);
        
        // Utiliser le premier élément comme valeur par défaut s'il existe
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0].id);
        }
        
        if (fetchedPartners.length > 0) {
          setSelectedPartner(fetchedPartners[0].id);
        }
        
        // Générer les données initiales
        generateTrendData();
        generateSeasonalData();
        generateComparisonData();
        
      } catch (error) {
        console.error("Erreur lors du chargement des données initiales:", error);
        toast.error("Impossible de charger les données initiales");
      }
    };
    
    loadInitialData();
  }, []);
  
  // Mettre à jour les données lorsque les paramètres changent
  useEffect(() => {
    generateTrendData();
    generateComparisonData();
  }, [selectedCategory, selectedPartner, analysisDate]);
  
  // Mettre à jour les données saisonnières lorsque la catégorie change
  useEffect(() => {
    generateSeasonalData();
  }, [selectedCategory]);
  
  const generateTrendData = async () => {
    setIsLoading(true);
    try {
      if (!analysisDate) return;
      
      const startDate = subDays(analysisDate, DAYS_TO_SHOW / 2);
      const endDate = addDays(analysisDate, DAYS_TO_SHOW / 2);
      
      const dailyRates = await fetchDailyBaseRates(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      
      // Créer une map des taux par date
      const ratesMap = new Map();
      dailyRates.forEach(rate => {
        ratesMap.set(rate.date, {
          ota_rate: rate.ota_rate,
          travco_rate: rate.travco_rate
        });
      });
      
      const data = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const rates = ratesMap.get(dateStr);
        
        const entry = {
          date: dateStr,
          baseRate: rates ? rates.ota_rate : generateEstimatedRate(currentDate),
          isToday: isSameDay(currentDate, new Date()),
          isSelectedDate: isSameDay(currentDate, analysisDate)
        };
        
        // Ajouter les taux pour différents plans
        entry['Standard'] = Math.round(entry.baseRate * 1);
        entry['Flexible'] = Math.round(entry.baseRate * 1.15);
        entry['Non-Remboursable'] = Math.round(entry.baseRate * 0.9);
        
        data.push(entry);
        currentDate = addDays(currentDate, 1);
      }
      
      setTrendData(data);
      
    } catch (error) {
      console.error("Erreur lors de la génération des données de tendance:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateEstimatedRate = (date: Date) => {
    // Estimer un tarif basé sur le jour de la semaine
    const isWeekend = [0, 6].includes(date.getDay());
    const baseRateValue = selectedCategory === '1' ? 130 :
                      selectedCategory === '2' ? 180 : 
                      selectedCategory === '3' ? 100 : 150;
    return isWeekend ? baseRateValue * 1.2 : baseRateValue;
  };
  
  const generateSeasonalData = () => {
    const data = [];
    const today = new Date();
    const monthsToShow = 12;
    
    for (let i = 0; i < monthsToShow; i++) {
      const month = (today.getMonth() + i) % 12;
      const year = today.getFullYear() + Math.floor((today.getMonth() + i) / 12);
      const monthDate = new Date(year, month, 1);
      
      // Adjust rates based on seasonal factors
      let seasonalFactor = 1;
      // High season: June, July, August
      if (month >= 5 && month <= 7) seasonalFactor = 1.3;
      // Mid season: April, May, September, October
      else if ([3, 4, 8, 9].includes(month)) seasonalFactor = 1.15;
      // Low season: rest of the year
      else seasonalFactor = 0.9;
      
      // Base rate from the selected category
      const baseRateValue = selectedCategory === '1' ? 130 :
                        selectedCategory === '2' ? 180 : 
                        selectedCategory === '3' ? 100 : 150;
      
      const entry = {
        month: format(monthDate, "MMM yy", { locale: fr }),
        monthNum: month,
        year: year,
        baseRate: Math.round(baseRateValue * seasonalFactor),
        isCurrent: today.getMonth() === month && today.getFullYear() === year,
      };
      
      // Add rates for different plans
      entry['Standard'] = Math.round(entry.baseRate * 1);
      entry['Flexible'] = Math.round(entry.baseRate * 1.15);
      entry['Non-Remboursable'] = Math.round(entry.baseRate * 0.9);
      
      // Add seasonal indicator
      if (seasonalFactor === 1.3) entry['season'] = 'Haute';
      else if (seasonalFactor === 1.15) entry['season'] = 'Moyenne';
      else entry['season'] = 'Basse';
      
      data.push(entry);
    }
    
    setSeasonalData(data);
  };
  
  const generateComparisonData = () => {
    const partnerData = [];
    
    // Compare rates across different partners for the selected date
    partners.forEach(partner => {
      // Create mock plans for demo purposes - to be replaced with real data
      const partnerPlans = [
        { name: 'Standard', adjustmentFactor: 1 },
        { name: 'Flexible', adjustmentFactor: 1.15 },
        { name: 'Non-Remboursable', adjustmentFactor: 0.9 }
      ];
      
      // Base value - in real app, this would come from the database
      const baseValue = 150;
      
      partnerPlans.forEach(plan => {
        partnerData.push({
          partner: partner.name,
          plan: plan.name,
          rate: Math.round(baseValue * plan.adjustmentFactor),
          isSelected: partner.id === selectedPartner
        });
      });
    });
    
    setComparisonData(partnerData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Analyses des tarifs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Paramètres d'analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium">Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !analysisDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {analysisDate ? (
                      format(analysisDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={analysisDate}
                    onSelect={setAnalysisDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">Catégorie</div>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
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
              <div className="font-medium">Partenaire</div>
              <Select 
                value={selectedPartner} 
                onValueChange={setSelectedPartner}
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
              <div className="font-medium">Métrique</div>
              <Select 
                value={selectedMetric} 
                onValueChange={setSelectedMetric}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une métrique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Métriques</SelectLabel>
                    <SelectItem value="trend">Tendance</SelectItem>
                    <SelectItem value="seasonal">Saisonnalité</SelectItem>
                    <SelectItem value="comparison">Comparaison</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <div className="flex space-x-1 border rounded-md bg-muted">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-none rounded-l-md",
                  chartView === "area" && "bg-background border-r"
                )}
                onClick={() => setChartView("area")}
              >
                <ChartLine className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-none",
                  chartView === "bar" && "bg-background border-x"
                )}
                onClick={() => setChartView("bar")}
              >
                <ChartBar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-none rounded-r-md",
                  chartView === "table" && "bg-background border-l"
                )}
                onClick={() => setChartView("table")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedMetric === "trend" && "Tendance des tarifs"}
              {selectedMetric === "seasonal" && "Analyse saisonnière"}
              {selectedMetric === "comparison" && "Comparaison des partenaires"}
            </CardTitle>
            <CardDescription>
              {selectedMetric === "trend" && "Évolution des tarifs sur 30 jours"}
              {selectedMetric === "seasonal" && "Variation des tarifs par saison"}
              {selectedMetric === "comparison" && "Comparaison des tarifs par partenaire"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {selectedMetric === "trend" && chartView === "area" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFlex" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), "d MMM", { locale: fr })}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} €`, ""]}
                      labelFormatter={(date) => format(new Date(date), "eeee d MMMM", { locale: fr })}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="baseRate" 
                      name="Tarif de base"
                      stroke="#1E40AF" 
                      fillOpacity={1} 
                      fill="url(#colorBase)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Standard" 
                      name="Standard"
                      stroke="#10B981" 
                      fillOpacity={1} 
                      fill="url(#colorStandard)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Flexible" 
                      name="Flexible"
                      stroke="#8B5CF6" 
                      fillOpacity={1} 
                      fill="url(#colorFlex)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              
              {selectedMetric === "trend" && chartView === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), "d MMM", { locale: fr })}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} €`, ""]}
                      labelFormatter={(date) => format(new Date(date), "eeee d MMMM", { locale: fr })}
                    />
                    <Legend />
                    <Bar dataKey="baseRate" name="Tarif de base" fill="#1E40AF" />
                    <Bar dataKey="Standard" name="Standard" fill="#10B981" />
                    <Bar dataKey="Flexible" name="Flexible" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {selectedMetric === "trend" && chartView === "table" && (
                <div className="overflow-y-auto h-full tariff-scrollbar">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 text-left">Date</th>
                        <th className="border px-4 py-2 text-right">Tarif de base</th>
                        <th className="border px-4 py-2 text-right">Standard</th>
                        <th className="border px-4 py-2 text-right">Flexible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendData.map((row, i) => (
                        <tr key={i} className={cn(
                          i % 2 === 0 ? "bg-muted/50" : "",
                          row.isSelectedDate ? "bg-primary/10" : "",
                          row.isToday ? "bg-primary/5 font-medium" : ""
                        )}>
                          <td className="border px-4 py-2">
                            {format(new Date(row.date), "EEE d MMM", { locale: fr })}
                            {row.isToday && " (aujourd'hui)"}
                          </td>
                          <td className="border px-4 py-2 text-right">{row.baseRate} €</td>
                          <td className="border px-4 py-2 text-right">{row.Standard} €</td>
                          <td className="border px-4 py-2 text-right">{row.Flexible} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {selectedMetric === "seasonal" && chartView !== "table" && (
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "area" ? (
                    <LineChart
                      data={seasonalData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} €`, ""]} />
                      <Legend />
                      
                      {/* Background Areas for Seasons */}
                      {seasonalData.map((entry, index) => {
                        // Skip entries that don't start a new season block
                        if (index > 0 && entry.season === seasonalData[index - 1].season) {
                          return null;
                        }
                        
                        // Find how many entries in sequence have the same season
                        let width = 1;
                        for (let i = index + 1; i < seasonalData.length; i++) {
                          if (seasonalData[i].season === entry.season) {
                            width++;
                          } else {
                            break;
                          }
                        }
                        
                        const seasonColors = {
                          "Haute": "#FFEDD5",
                          "Moyenne": "#E0F2FE",
                          "Basse": "#ECFDF5"
                        };
                        
                        return (
                          <rect
                            key={`season-${index}`}
                            x={`${(index * 100) / seasonalData.length}%`}
                            y="0%"
                            width={`${(width * 100) / seasonalData.length}%`}
                            height="100%"
                            fill={seasonColors[entry.season as keyof typeof seasonColors] || "#f0f0f0"}
                            fillOpacity={0.3}
                          />
                        );
                      })}
                      
                      <Line
                        type="monotone"
                        dataKey="Standard"
                        stroke="#1E40AF"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Flexible"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Non-Remboursable"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={seasonalData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} €`, ""]} />
                      <Legend />
                      <Bar dataKey="Standard" name="Standard" fill="#1E40AF" />
                      <Bar dataKey="Flexible" name="Flexible" fill="#8B5CF6" />
                      <Bar dataKey="Non-Remboursable" name="Non-Remboursable" fill="#10B981" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
              
              {selectedMetric === "seasonal" && chartView === "table" && (
                <div className="overflow-y-auto h-full tariff-scrollbar">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 text-left">Mois</th>
                        <th className="border px-4 py-2 text-left">Saison</th>
                        <th className="border px-4 py-2 text-right">Standard</th>
                        <th className="border px-4 py-2 text-right">Flexible</th>
                        <th className="border px-4 py-2 text-right">Non-Remboursable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonalData.map((row, i) => {
                        const seasonColors = {
                          "Haute": "bg-orange-50 text-orange-700",
                          "Moyenne": "bg-blue-50 text-blue-700",
                          "Basse": "bg-green-50 text-green-700"
                        };
                        
                        return (
                          <tr key={i} className={cn(
                            i % 2 === 0 ? "bg-muted/50" : "",
                            row.isCurrent && "bg-primary/10 font-medium"
                          )}>
                            <td className="border px-4 py-2">
                              {row.month}
                              {row.isCurrent && " (actuel)"}
                            </td>
                            <td className={cn(
                              "border px-4 py-2",
                              seasonColors[row.season as keyof typeof seasonColors]
                            )}>
                              {row.season}
                            </td>
                            <td className="border px-4 py-2 text-right">{row.Standard} €</td>
                            <td className="border px-4 py-2 text-right">{row.Flexible} €</td>
                            <td className="border px-4 py-2 text-right">{row['Non-Remboursable']} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {selectedMetric === "comparison" && chartView === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="partner"
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip formatter={(value) => [`${value} €`, ""]} />
                    <Legend />
                    <Bar 
                      dataKey="rate" 
                      name="Tarif" 
                      fill="#1E40AF"
                      label={{ position: 'right', formatter: (value) => `${value} €` }}
                      background={{ fill: '#eee' }}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.isSelected ? '#1E40AF' : '#6B7280'}
                          opacity={entry.plan === 'Standard' ? 1 : entry.plan === 'Flexible' ? 0.8 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {selectedMetric === "comparison" && chartView === "area" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="partner" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} €`, ""]} />
                    <Legend />
                    <Bar 
                      dataKey="rate" 
                      name="Tarif" 
                      fill="#1E40AF"
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.isSelected ? '#1E40AF' : '#6B7280'}
                          opacity={entry.plan === 'Standard' ? 1 : entry.plan === 'Flexible' ? 0.8 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {selectedMetric === "comparison" && chartView === "table" && (
                <div className="overflow-y-auto h-full tariff-scrollbar">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 text-left">Partenaire</th>
                        <th className="border px-4 py-2 text-left">Plan</th>
                        <th className="border px-4 py-2 text-right">Tarif</th>
                        <th className="border px-4 py-2 text-right">Diff. avec sélection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, i) => {
                        // Calculate difference from selected partner's rate
                        const selectedRate = comparisonData.find(
                          item => item.isSelected && item.plan === row.plan
                        )?.rate || 0;
                        
                        const difference = row.rate - selectedRate;
                        
                        return (
                          <tr key={i} className={cn(
                            i % 2 === 0 ? "bg-muted/50" : "",
                            row.isSelected && "bg-primary/10 font-medium"
                          )}>
                            <td className="border px-4 py-2">
                              {row.partner}
                              {row.isSelected && " (sélectionné)"}
                            </td>
                            <td className="border px-4 py-2">{row.plan}</td>
                            <td className="border px-4 py-2 text-right">{row.rate} €</td>
                            <td className={cn(
                              "border px-4 py-2 text-right",
                              difference > 0 ? "text-tariff-red" : 
                              difference < 0 ? "text-tariff-green" : ""
                            )}>
                              {row.isSelected ? "-" : (
                                difference > 0 ? `+${difference} €` : 
                                difference < 0 ? `${difference} €` : "0 €"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Observations clés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedMetric === "trend" && (
              <>
                <div className="font-medium">Tendances sur 30 jours</div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Variation moyenne des tarifs: <span className="font-medium">±5.2%</span>
                  </li>
                  <li>
                    Pics tarifaires principalement observés les weekends (vendredi, samedi)
                  </li>
                  <li>
                    Le tarif "Flexible" est en moyenne <span className="font-medium">15%</span> plus élevé que le standard
                  </li>
                </ul>
              </>
            )}
            
            {selectedMetric === "seasonal" && (
              <>
                <div className="font-medium">Variations saisonnières</div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Haute saison (juin-août): <span className="font-medium">+30%</span> vs moyenne annuelle
                  </li>
                  <li>
                    Moyenne saison (avr-mai, sept-oct): <span className="font-medium">+15%</span> vs moyenne annuelle
                  </li>
                  <li>
                    Basse saison (nov-mars): <span className="font-medium">-10%</span> vs moyenne annuelle
                  </li>
                </ul>
              </>
            )}
            
            {selectedMetric === "comparison" && (
              <>
                <div className="font-medium">Comparaison entre partenaires</div>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-medium">Booking</span> a généralement les tarifs les plus élevés pour les plans flexibles
                  </li>
                  <li>
                    <span className="font-medium">Direct</span> offre les meilleurs tarifs, avec -5% vs OTAs
                  </li>
                  <li>
                    Les plans Non-Remboursables sont en moyenne <span className="font-medium">10%</span> moins chers
                  </li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Résumé de l'analyse</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMetric === "trend" && (
              <div className="space-y-4">
                <p>
                  L'analyse des tendances sur les 30 derniers jours pour la catégorie <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name || ""}</span> montre:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="text-sm text-muted-foreground">Tarif le plus bas</div>
                    <div className="mt-1 text-xl font-bold">
                      {trendData.length > 0 ? Math.min(...trendData.map(d => d.baseRate)) : "-"} €
                    </div>
                    <div className="mt-1 text-xs">
                      {trendData.length > 0 ? (
                        `le ${format(
                          new Date(trendData.reduce((prev, curr) => 
                            prev.baseRate < curr.baseRate ? prev : curr
                          ).date),
                          "d MMMM",
                          { locale: fr }
                        )}`
                      ) : ""}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="text-sm text-muted-foreground">Tarif le plus élevé</div>
                    <div className="mt-1 text-xl font-bold">
                      {trendData.length > 0 ? Math.max(...trendData.map(d => d.baseRate)) : "-"} €
                    </div>
                    <div className="mt-1 text-xs">
                      {trendData.length > 0 ? (
                        `le ${format(
                          new Date(trendData.reduce((prev, curr) => 
                            prev.baseRate > curr.baseRate ? prev : curr
                          ).date),
                          "d MMMM",
                          { locale: fr }
                        )}`
                      ) : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-medium mb-2">Recommandations</div>
                  <p className="text-sm">
                    Basé sur cette analyse, vous pourriez optimiser vos revenus en:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Ajustant les tarifs à la hausse pour les weekends</li>
                    <li>Réévaluant les plans flexibles qui présentent un écart important</li>
                    <li>Surveillant la tendance globale pour anticiper les fluctuations futures</li>
                  </ul>
                </div>
              </div>
            )}
            
            {selectedMetric === "seasonal" && (
              <div className="space-y-4">
                <p>
                  L'analyse saisonnière pour la catégorie <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name || ""}</span> révèle:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="border rounded-lg p-3 bg-orange-50">
                    <div className="text-sm font-medium text-orange-700">Haute saison</div>
                    <div className="mt-1 text-lg font-bold">
                      {Math.round(seasonalData.filter(d => d.season === 'Haute').reduce((acc, curr) => acc + curr.baseRate, 0) / 
                      (seasonalData.filter(d => d.season === 'Haute').length || 1))} €
                    </div>
                    <div className="mt-1 text-xs">juin - août</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-blue-50">
                    <div className="text-sm font-medium text-blue-700">Moyenne saison</div>
                    <div className="mt-1 text-lg font-bold">
                      {Math.round(seasonalData.filter(d => d.season === 'Moyenne').reduce((acc, curr) => acc + curr.baseRate, 0) / 
                      (seasonalData.filter(d => d.season === 'Moyenne').length || 1))} €
                    </div>
                    <div className="mt-1 text-xs">avr-mai, sept-oct</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-green-50">
                    <div className="text-sm font-medium text-green-700">Basse saison</div>
                    <div className="mt-1 text-lg font-bold">
                      {Math.round(seasonalData.filter(d => d.season === 'Basse').reduce((acc, curr) => acc + curr.baseRate, 0) / 
                      (seasonalData.filter(d => d.season === 'Basse').length || 1))} €
                    </div>
                    <div className="mt-1 text-xs">novembre - mars</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-medium mb-2">Stratégies recommandées</div>
                  <p className="text-sm">
                    Pour maximiser vos revenus à travers les saisons:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>En haute saison: Limitez les offres spéciales et maximisez les tarifs standards</li>
                    <li>En moyenne saison: Proposez des offres pour séjours prolongés</li>
                    <li>En basse saison: Envisagez des packages et promotions pour stimuler la demande</li>
                  </ul>
                </div>
              </div>
            )}
            
            {selectedMetric === "comparison" && (
              <div className="space-y-4">
                <p>
                  La comparaison entre partenaires pour la catégorie <span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name || ""}</span> montre:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left py-2">Partenaire</th>
                        <th className="text-right py-2">Tarif moyen</th>
                        <th className="text-right py-2">Écart vs. moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map(partner => {
                        const partnerRates = comparisonData
                          .filter(item => item.partner === partner.name)
                          .map(item => item.rate);
                        
                        if (partnerRates.length === 0) return null;
                        
                        const avgRate = Math.round(
                          partnerRates.reduce((acc, rate) => acc + rate, 0) / partnerRates.length
                        );
                        
                        // Calculate global average
                        const globalAvg = comparisonData.length > 0 ? Math.round(
                          comparisonData.reduce((acc, item) => acc + item.rate, 0) / comparisonData.length
                        ) : 0;
                        
                        const diff = avgRate - globalAvg;
                        const percentage = globalAvg > 0 ? Math.round((diff / globalAvg) * 100) : 0;
                        
                        return (
                          <tr key={partner.id} className={
                            partner.id === selectedPartner ? "font-medium bg-primary/10" : ""
                          }>
                            <td className="py-2">{partner.name}</td>
                            <td className="text-right py-2">{avgRate} €</td>
                            <td className={cn(
                              "text-right py-2",
                              diff > 0 ? "text-tariff-red" : diff < 0 ? "text-tariff-green" : ""
                            )}>
                              {diff === 0 ? "-" : (
                                <>
                                  {diff > 0 ? "+" : ""}{diff} € ({percentage}%)
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4">
                  <div className="font-medium mb-2">Points d'attention</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>
                      {comparisonData.some(item => 
                        item.partner === partners.find(p => p.id === selectedPartner)?.name && 
                        item.rate > (comparisonData.reduce((acc, item) => acc + item.rate, 0) / comparisonData.length)
                      ) 
                      ? `Les tarifs de ${partners.find(p => p.id === selectedPartner)?.name || ""} sont supérieurs à la moyenne du marché`
                      : `Les tarifs de ${partners.find(p => p.id === selectedPartner)?.name || ""} sont compétitifs sur le marché`}
                    </li>
                    <li>Les écarts les plus importants sont observés sur les plans flexibles</li>
                    <li>Considérez d'aligner les tarifs non-remboursables entre les partenaires</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TariffAnalysis;
