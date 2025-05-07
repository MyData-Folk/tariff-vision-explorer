
import React from "react";
import { 
  ChartBar, 
  CalendarDays, 
  ChartLine, 
  CircleArrowUp, 
  CircleArrowDown 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateMockActivities } from "@/lib/mockData";

// Sample data for the chart
const chartData = [
  { date: '2025-05-01', Booking: 142, Expedia: 135, Direct: 128 },
  { date: '2025-05-02', Booking: 145, Expedia: 139, Direct: 130 },
  { date: '2025-05-03', Booking: 150, Expedia: 145, Direct: 135 },
  { date: '2025-05-04', Booking: 155, Expedia: 148, Direct: 138 },
  { date: '2025-05-05', Booking: 158, Expedia: 152, Direct: 140 },
  { date: '2025-05-06', Booking: 160, Expedia: 155, Direct: 145 },
  { date: '2025-05-07', Booking: 165, Expedia: 158, Direct: 148 },
];

const Dashboard = () => {
  const activities = generateMockActivities();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tarif moyen"
          value="149 €"
          description="par nuit"
          icon={<ChartLine className="h-5 w-5" />}
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatCard
          title="Réservations"
          value="42"
          description="derniers 7 jours"
          icon={<CalendarDays className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Écart tarifaire"
          value="4.8%"
          description="vs. mois précédent"
          icon={<CircleArrowUp className="h-5 w-5" />}
          trend={{ value: 1.2, isPositive: true }}
        />
        <StatCard
          title="Tarifs manquants"
          value="3"
          description="à compléter"
          icon={<CircleArrowDown className="h-5 w-5" />}
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des tarifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
            </div>
          </CardContent>
        </Card>

        <RecentActivity activities={activities} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tarifs par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Deluxe</span>
                <span className="font-medium">145 €</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Suite</span>
                <span className="font-medium">210 €</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Standard</span>
                <span className="font-medium">115 €</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Premium</span>
                <span className="font-medium">175 €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Button variant="default" className="w-full">
                  <ChartBar className="mr-2 h-4 w-4" />
                  Calculer un tarif
                </Button>
              </div>
              <Button variant="outline">
                Comparer des tarifs
              </Button>
              <Button variant="outline">
                Analyser les tendances
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Import the Button component
import { Button } from "@/components/ui/button";

export default Dashboard;
