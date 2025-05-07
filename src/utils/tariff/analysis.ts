
// Fonctions d'analyse pour les comparaisons de tarifs

// Types pour les données d'analyse
export interface DifferenceData {
  plan: string;
  baselinePlan: string;
  averageDifference: number;
  percentDifference: string; // Pourcentage sous forme de chaîne avec '%'
  isAbove: boolean;
}

// Analyse les différences de tarif entre plans
export const analyzeDifferences = (data: any[], baselinePlan: string): DifferenceData[] => {
  if (!data || data.length === 0) return [];

  const planNames = [...new Set(data.map(item => item.plan))].filter(p => p !== baselinePlan);
  
  return planNames.map(plan => {
    const planData = data.filter(item => item.plan === plan);
    const baselineData = data.filter(item => item.plan === baselinePlan);
    
    // Calcul de la différence moyenne
    let totalDiff = 0;
    let count = 0;
    
    planData.forEach(pItem => {
      const baseItem = baselineData.find(bItem => bItem.date === pItem.date);
      if (baseItem && baseItem.price && pItem.price) {
        totalDiff += (Number(pItem.price) - Number(baseItem.price));
        count++;
      }
    });
    
    const avgDiff = count > 0 ? totalDiff / count : 0;
    const baselineAvg = baselineData.reduce((sum, item) => sum + Number(item.price || 0), 0) / baselineData.length || 1;
    const percentDiff = ((avgDiff / baselineAvg) * 100).toFixed(2) + '%';
    
    return {
      plan,
      baselinePlan,
      averageDifference: avgDiff,
      percentDifference: percentDiff,
      isAbove: avgDiff > 0
    };
  });
};

// Calculate differences between plans for chart data
export const calculateDifferences = (
  chartData: any[], 
  selectedPartners: { partnerId: string; partnerName: string; planId: string; planName: string; }[]
): DifferenceData[] => {
  if (!chartData || chartData.length === 0 || selectedPartners.length <= 1) {
    return [];
  }
  
  // Use the first selected partner/plan as the baseline
  const baselinePlan = `${selectedPartners[0].partnerName} - ${selectedPartners[0].planName}`;
  
  // Process data for analysis
  const processedData = chartData.flatMap(dayData => {
    const date = dayData.date;
    const results = [];
    
    // Extract each plan's data for this day
    selectedPartners.forEach(partner => {
      const planName = `${partner.partnerName} - ${partner.planName}`;
      if (dayData[planName] !== undefined) {
        results.push({
          date,
          plan: planName,
          price: dayData[planName]
        });
      }
    });
    
    return results;
  });
  
  // Use the analyzeDifferences function to calculate differentials
  return analyzeDifferences(processedData, baselinePlan);
};
