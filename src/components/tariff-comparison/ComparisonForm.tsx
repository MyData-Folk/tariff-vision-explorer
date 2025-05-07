
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComparisonFormProps } from "./types";
import { DateRangeSelector } from "./form/DateRangeSelector";
import { PartnerSelector } from "./form/PartnerSelector";
import { VisualizationSelector } from "./form/VisualizationSelector";
import { usePartnerPlans } from "./form/usePartnerPlans";

export function ComparisonForm({
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
}: ComparisonFormProps) {
  
  // Get partner plans using our custom hook
  const partnerPlans = usePartnerPlans(allPartners, allPlans);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de comparaison</CardTitle>
        <CardDescription>
          Sélectionnez une période et des partenaires à comparer
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
}
