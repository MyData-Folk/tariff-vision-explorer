
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComparisonFormProps } from "./types";
import { DateRangeSelector } from "@/components/tariff-comparison/form/DateRangeSelector";
import { PartnerSelector } from "@/components/tariff-comparison/form/PartnerSelector";
import { VisualizationSelector } from "@/components/tariff-comparison/form/VisualizationSelector";
import { usePartnerPlans } from "@/components/tariff-comparison/form/usePartnerPlans";

export const DatabaseManager = ({
  dateRange,
  setDateRange,
  selectedPartners,
  setSelectedPartners,
  comparisonMode,
  setComparisonMode,
  onCompare,
  isLoading,
  allPartners,
  allPlans
}: ComparisonFormProps) => {
  
  // Get partner plans using our custom hook
  const partnerPlans = usePartnerPlans(allPartners, allPlans);

  return (
    <Card className="shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="text-blue-800">Base de données</CardTitle>
        <CardDescription>
          Gérez vos partenaires et plans tarifaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date range selection */}
          <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
          
          {/* Partner selection */}
          <PartnerSelector 
            selectedPartners={selectedPartners}
            setSelectedPartners={setSelectedPartners}
            allPartners={allPartners}
            partnerPlans={partnerPlans}
          />
          
          {/* Visualization mode */}
          <VisualizationSelector 
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            onCompare={onCompare}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Export par défaut pour compatibilité
export default DatabaseManager;
