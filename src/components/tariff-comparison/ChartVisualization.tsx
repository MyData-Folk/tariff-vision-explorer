
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
} from "recharts";
import { ChartVisualizationProps } from "./types";

export function ChartVisualization({ 
  chartData, 
  comparisonMode, 
  selectedPartners,
  dateRange 
}: ChartVisualizationProps) {
  
  // Get array of selected plan display names
  const getSelectedPlanNames = () => {
    return selectedPartners
      .filter(p => p.partnerId && p.planName)
      .map(p => `${p.partnerName} - ${p.planName}`);
  };

  return (
    <>
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
                      {row[plan]} €
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
