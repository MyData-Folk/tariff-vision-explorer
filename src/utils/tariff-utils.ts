
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
  // Règles mises à jour pour différencier les partenaires TRAVCO des autres
  const planRules: {[key: string]: { source: string, multiplier: number, offset: number }} = {
    // Plans standard basés sur OTA-RO-FLEX
    "ota-ro-flex": { source: "ota_rate", multiplier: 1.00, offset: 0 },
    "ota-ro-flex-net": { source: "ota_rate", multiplier: 0.85, offset: 0 }, // Commission à 15%
    "ota-ro-nrf": { source: "ota_rate", multiplier: 1.15, offset: 0 }, // +15% pour non-remboursable
    "ota-ro-nrf-net": { source: "ota_rate", multiplier: 0.98, offset: 0 }, // NRF avec commission
    
    // Plans TRAVCO basés sur TRAVCO-BB-FLEX-NET
    "travco": { source: "travco_rate", multiplier: 1.00, offset: 0 },
    "travco-bb-flex-net": { source: "travco_rate", multiplier: 1.00, offset: 0 },
    "travco-bb-nrf-net": { source: "travco_rate", multiplier: 1.15, offset: 0 }, // +15% pour non-remboursable
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
        const planCode = partnerData.planName.toLowerCase();
        const isTravco = partnerData.partnerName.toLowerCase().includes('travco');
        
        // Déterminer la règle à appliquer
        let rule = { source: "ota_rate", multiplier: 1, offset: 0 };
        
        // Chercher la règle spécifique pour ce plan
        for (const [planKey, planRule] of Object.entries(planRules)) {
          if (planCode.includes(planKey)) {
            rule = planRule;
            break;
          }
        }
        
        // Si c'est TRAVCO mais qu'on n'a pas trouvé de règle spécifique
        if (isTravco && rule.source !== "travco_rate") {
          rule = planRules["travco-bb-flex-net"];
        }
        
        // Appliquer la règle
        const baseRate = rule.source === "travco_rate" ? rates.travco_rate : rates.ota_rate;
        const calculatedRate = (Number(baseRate) * rule.multiplier) + rule.offset;
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        entry[displayName] = Math.round(calculatedRate);
      });
      
      data.push(entry);
    } else {
      // If no data for this date, use estimates
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const baseRate = isWeekend ? 140 : 120; // Estimate
      
      selectedPartners.forEach(partnerData => {
        const planCode = partnerData.planName.toLowerCase();
        const isTravco = partnerData.partnerName.toLowerCase().includes('travco');
        
        // Déterminer la règle à appliquer
        let rule = { source: "ota_rate", multiplier: 1, offset: 0 };
        
        // Chercher la règle spécifique pour ce plan
        for (const [planKey, planRule] of Object.entries(planRules)) {
          if (planCode.includes(planKey)) {
            rule = planRule;
            break;
          }
        }
        
        // Si c'est TRAVCO mais qu'on n'a pas trouvé de règle spécifique
        if (isTravco && rule.source !== "travco_rate") {
          rule = planRules["travco-bb-flex-net"];
        }
        
        // Pour les estimations, on applique un taux légèrement différent pour TRAVCO
        const estimatedBaseRate = isTravco ? baseRate * 0.9 : baseRate;
        const calculatedRate = (estimatedBaseRate * rule.multiplier) + rule.offset;
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        entry[displayName] = Math.round(calculatedRate);
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
      percentDifference: Math.abs(percentDiff.toFixed(1)), // Convertir en string
      isAbove: isPositive,
    };
  });

  return differences;
};
