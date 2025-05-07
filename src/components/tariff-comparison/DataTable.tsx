
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DataTableProps } from "./types";

export function DataTable({ chartData, selectedPartners }: DataTableProps) {
  // Get array of selected plan display names
  const getSelectedPlanNames = () => {
    return selectedPartners
      .filter(p => p.partnerId && p.planName)
      .map(p => `${p.partnerName} - ${p.planName}`);
  };

  return (
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
  );
}
