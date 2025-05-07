
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DailyRate } from "@/services/types";
import { ChartData, SelectedPartner, DifferenceData } from "@/components/tariff-comparison/types";

// Transform data for chart
export const transformDataForChart = (
  baseRates: DailyRate[], 
  dateRange: DateRange, 
  selectedPartners: SelectedPartner[]
): ChartData[] => {
  if (!dateRange.from || !dateRange.to || selectedPartners.length === 0) {
    return [];
  }

  const data: ChartData[] = [];
  
  // Create map for quick access
  const ratesMap = new Map();
  baseRates.forEach(rate => {
    ratesMap.set(rate.date, {
      ota_rate: rate.ota_rate,
      travco_rate: rate.travco_rate
    });
  });
  
  // Base rates for each plan
  const planMultipliers: {[key: string]: number} = {
    "standard": 1.00,
    "flexible": 1.15,
    "discount": 0.90,
    "premium": 1.25
  };
  
  // For each day in date range
  let currentDate = new Date(dateRange.from);
  const lastDate = new Date(dateRange.to);
  
  while (currentDate <= lastDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const entry: ChartData = { date: dateStr };
    
    // Find rates for this date
    const rates = ratesMap.get(dateStr);
    
    if (rates) {
      // Calculate rates for each selected partner
      selectedPartners.forEach(partnerData => {
        // Use ota_rate by default
        const baseRate = rates.ota_rate;
        
        // Determine multiplier based on plan code (simplified)
        const planCode = partnerData.planName.toLowerCase();
        let multiplier = 1;
        
        for (const [planKey, planValue] of Object.entries(planMultipliers)) {
          if (planCode.includes(planKey)) {
            multiplier = planValue;
            break;
          }
        }
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        // Convert to number and round
        entry[displayName] = Math.round(Number(baseRate) * multiplier);
      });
      
      data.push(entry);
    } else {
      // If no data for this date, use estimates
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const baseRate = isWeekend ? 140 : 120; // Estimate
      
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
    
    // Go to next day
    currentDate = addDays(currentDate, 1);
  }
  
  return data;
};

// Calculate differences between partners for analysis
export const calculateDifferences = (
  chartData: ChartData[],
  selectedPartners: SelectedPartner[]
): DifferenceData[] => {
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
