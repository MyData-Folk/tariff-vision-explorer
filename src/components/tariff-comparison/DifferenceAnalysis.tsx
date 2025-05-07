
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { DifferenceAnalysisProps } from "./types";

export function DifferenceAnalysis({ 
  differencesData, 
  chartData, 
  selectedPartners 
}: DifferenceAnalysisProps) {
  
  // Get array of selected plan display names
  const getSelectedPlanNames = () => {
    return selectedPartners
      .filter(p => p.partnerId && p.planName)
      .map(p => `${p.partnerName} - ${p.planName}`);
  };

  return (
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
            {selectedPartners.length > 0 && selectedPartners[0].partnerName && (
              <p>
                Sur la période analysée, le plan <strong>{selectedPartners[0].partnerName} - {selectedPartners[0].planName}</strong> a servi
                de référence. Les observations suivantes ont été relevées:
              </p>
            )}
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
  );
}
