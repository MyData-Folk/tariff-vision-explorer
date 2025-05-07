
import { ChartData, SelectedPartner, DifferenceData } from "@/components/tariff-comparison/types";

// Calculate differences between partners for analysis
export const calculateDifferences = (
  chartData: ChartData[],
  selectedPartners: SelectedPartner[]
): DifferenceData[] => {
  if (!chartData.length || selectedPartners.length < 2) return [];

  const firstPartner = `${selectedPartners[0].partnerName} - ${selectedPartners[0].planName}`;
  
  const differences: DifferenceData[] = selectedPartners.slice(1).map(partner => {
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
      percentDifference: Math.abs(percentDiff.toFixed(1)), // Convert to string with 1 decimal place
      isAbove: isPositive,
    };
  });

  return differences;
};
