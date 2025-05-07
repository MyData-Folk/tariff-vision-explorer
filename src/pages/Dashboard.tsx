
import React, { useEffect, useState } from "react";
import { 
  ChartBar, 
  CalendarDays, 
  ChartLine, 
  CircleArrowUp, 
  CircleArrowDown,
  BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateMockActivities } from "@/lib/mockData";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [activities] = useState(() => generateMockActivities());
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRate, setAverageRate] = useState<number | null>(null);
  const [rateTrend, setRateTrend] = useState<{value: number, isPositive: boolean}>({value: 0, isPositive: true});
  const [bookings, setBookings] = useState<number | null>(null);
  const [missingRates, setMissingRates] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [categoryRates, setCategoryRates] = useState<{[key: string]: number}>({});

  const loadDashboardData = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    
    try {
      // Formater les dates pour la requête
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Charger les tarifs quotidiens
      const { data: baseRates, error: baseRatesError } = await supabase
        .from('daily_base_rates')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      
      if (baseRatesError) throw baseRatesError;
      
      // Calculer la moyenne et la tendance
      if (baseRates && baseRates.length > 0) {
        // Transformer pour le graphique
        const formattedData = baseRates.map(rate => ({
          date: rate.date,
          Booking: Math.round(rate.ota_rate * 1.05),
          Expedia: Math.round(rate.ota_rate * 1.03),
          Direct: Math.round(rate.ota_rate)
        }));
        
        setChartData(formattedData);
        
        // Calculer la moyenne actuelle
        const totalOTA = baseRates.reduce((sum, rate) => sum + Number(rate.ota_rate), 0);
        const currentAvg = Math.round(totalOTA / baseRates.length);
        setAverageRate(currentAvg);
        
        // Charger les données pour le mois précédent pour comparer
        const prevMonthStart = startOfMonth(subDays(dateRange.from, 30));
        const prevMonthEnd = endOfMonth(subDays(dateRange.from, 30));
        
        const { data: prevRates, error: prevRatesError } = await supabase
          .from('daily_base_rates')
          .select('ota_rate')
          .gte('date', format(prevMonthStart, 'yyyy-MM-dd'))
          .lte('date', format(prevMonthEnd, 'yyyy-MM-dd'));
        
        if (prevRatesError) throw prevRatesError;
        
        if (prevRates && prevRates.length > 0) {
          const totalPrevOTA = prevRates.reduce((sum, rate) => sum + Number(rate.ota_rate), 0);
          const prevAvg = totalPrevOTA / prevRates.length;
          
          // Calculer la tendance
          const trendPercentage = ((currentAvg - prevAvg) / prevAvg) * 100;
          setRateTrend({
            value: Math.abs(Math.round(trendPercentage * 10) / 10),
            isPositive: trendPercentage > 0
          });
        }
      } else {
        setChartData([]);
        setAverageRate(null);
      }
      
      // Simuler le nombre de réservations (normalement depuis une table de réservations)
      setBookings(42);
      
      // Simuler le nombre de tarifs manquants
      const gapsInDates = 3; // En réalité, calculez cela en vérifiant les dates manquantes
      setMissingRates(gapsInDates);
      
      // Charger les tarifs par catégorie
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) throw categoriesError;
      
      if (categories) {
        const categoryRatesObj: {[key: string]: number} = {};
        categories.forEach(category => {
          // Simuler des tarifs différents par catégorie
          switch (category.name.toLowerCase()) {
            case 'deluxe': categoryRatesObj[category.name] = 145; break;
            case 'suite': categoryRatesObj[category.name] = 210; break;
            case 'standard': categoryRatesObj[category.name] = 115; break;
            case 'premium': categoryRatesObj[category.name] = 175; break;
            default: categoryRatesObj[category.name] = 140;
          }
        });
        setCategoryRates(categoryRatesObj);
      }
      
    } catch (error) {
      console.error("Erreur lors du chargement des données du dashboard:", error);
      toast.error("Impossible de charger les données du dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données au montage et quand la plage de dates change
  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      
      <div className="flex justify-between items-center">
        <div>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
        <Button
          variant="outline"
          onClick={loadDashboardData}
          disabled={isLoading}
          className="glass-effect"
        >
          {isLoading ? "Chargement..." : "Rafraîchir"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tarif moyen"
          value={averageRate ? `${averageRate} €` : "N/A"}
          description="par nuit"
          icon={<ChartLine className="h-5 w-5" />}
          trend={rateTrend}
        />
        <StatCard
          title="Réservations"
          value={bookings?.toString() || "N/A"}
          description="derniers 7 jours"
          icon={<CalendarDays className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Écart tarifaire"
          value={rateTrend ? `${rateTrend.value}%` : "N/A"}
          description="vs. mois précédent"
          icon={<CircleArrowUp className="h-5 w-5" />}
          trend={rateTrend}
        />
        <StatCard
          title="Tarifs manquants"
          value={missingRates?.toString() || "N/A"}
          description="à compléter"
          icon={<CircleArrowDown className="h-5 w-5" />}
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 glass-effect">
          <CardHeader>
            <CardTitle>Évolution des tarifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: fr })}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      formatter={(value) => [`${value} €`, ""]}
                      labelFormatter={(date) => format(new Date(date), "eeee d MMMM", { locale: fr })}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Booking"
                      stroke="#1E40AF"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expedia"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Direct"
                      stroke="#6B7280"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <RecentActivity activities={activities} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Tarifs par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryRates).length > 0 ? (
                Object.entries(categoryRates).map(([category, rate]) => (
                  <div key={category} className="flex justify-between items-center bg-white/5 p-3 rounded-md">
                    <span>{category}</span>
                    <span className="font-medium">{rate} €</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune catégorie disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Button variant="default" className="w-full btn-3d">
                  <ChartBar className="mr-2 h-4 w-4" />
                  Calculer un tarif
                </Button>
              </div>
              <Button variant="outline" className="glass-effect">
                Comparer des tarifs
              </Button>
              <Button variant="outline" className="glass-effect">
                Analyser les tendances
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
