
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DailyRate } from "@/services/types";
import { ChartData, SelectedPartner } from "@/components/tariff-comparison/types";
import { supabase } from "@/integrations/supabase/client";
import { getPlanRules } from "./rules";

// Transform data for chart
export const transformDataForChart = async (
  baseRates: DailyRate[], 
  dateRange: DateRange, 
  selectedPartners: SelectedPartner[]
): Promise<ChartData[]> => {
  if (!dateRange.from || !dateRange.to || selectedPartners.length === 0) {
    return [];
  }

  // Récupérer les règles de plan depuis la base de données
  const planRulesData = await getPlanRules();
  
  const data: ChartData[] = [];
  
  // Créer un mappage pour un accès rapide aux tarifs de base
  const ratesMap = new Map();
  baseRates.forEach(rate => {
    ratesMap.set(rate.date, {
      ota_rate: rate.ota_rate,
      travco_rate: rate.travco_rate
    });
  });
  
  // Règles par défaut au cas où les règles ne sont pas trouvées dans la base de données
  const defaultPlanRules: {[key: string]: { source: string, multiplier: number, offset: number }} = {
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
  
  // Créer un mappage des règles de plan par ID de plan
  const planRulesMap = new Map();
  planRulesData?.forEach(rule => {
    const steps = rule.steps as any[];
    // Extraire les multiplicateurs et offsets des étapes
    let multiplier = 1.0;
    let offset = 0;
    
    if (steps && Array.isArray(steps)) {
      steps.forEach(step => {
        if (step.type === 'multiply') multiplier *= parseFloat(step.value);
        if (step.type === 'add') offset += parseFloat(step.value);
      });
    }
    
    planRulesMap.set(rule.plan_id, {
      source: rule.base_source,
      multiplier,
      offset
    });
  });
  
  // Pour chaque jour dans la plage de dates
  let currentDate = new Date(dateRange.from);
  const lastDate = new Date(dateRange.to);
  
  while (currentDate <= lastDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const entry: ChartData = { date: dateStr };
    
    // Trouver les tarifs pour cette date
    const rates = ratesMap.get(dateStr);
    
    if (rates) {
      // Calculer les tarifs pour chaque partenaire sélectionné
      for (const partnerData of selectedPartners) {
        const planCode = partnerData.planName.toLowerCase();
        const isTravco = partnerData.partnerName.toLowerCase().includes('travco');
        
        // Chercher les règles spécifiques pour ce plan
        let rule = { source: "ota_rate", multiplier: 1, offset: 0 };
        
        // D'abord, essayer d'utiliser les règles de la base de données
        if (planRulesMap.has(partnerData.planId)) {
          rule = planRulesMap.get(partnerData.planId);
        } else {
          // Sinon, utiliser les règles codées en dur
          for (const [planKey, planRule] of Object.entries(defaultPlanRules)) {
            if (planCode.includes(planKey)) {
              rule = planRule;
              break;
            }
          }
          
          // Si c'est TRAVCO mais qu'on n'a pas trouvé de règle spécifique
          if (isTravco && rule.source !== "travco_rate") {
            rule = defaultPlanRules["travco-bb-flex-net"];
          }
        }
        
        // Appliquer la règle
        const baseRate = rule.source === "travco_rate" ? rates.travco_rate : rates.ota_rate;
        const calculatedRate = (Number(baseRate) * rule.multiplier) + rule.offset;
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        entry[displayName] = Math.round(calculatedRate);
      }
      
      data.push(entry);
    } else {
      // Si aucune donnée pour cette date, utiliser des estimations
      const isWeekend = [0, 6].includes(currentDate.getDay());
      const baseRate = isWeekend ? 140 : 120; // Estimation
      
      for (const partnerData of selectedPartners) {
        const planCode = partnerData.planName.toLowerCase();
        const isTravco = partnerData.partnerName.toLowerCase().includes('travco');
        
        // Chercher les règles spécifiques pour ce plan
        let rule = { source: "ota_rate", multiplier: 1, offset: 0 };
        
        // D'abord, essayer d'utiliser les règles de la base de données
        if (planRulesMap.has(partnerData.planId)) {
          rule = planRulesMap.get(partnerData.planId);
        } else {
          // Sinon, utiliser les règles codées en dur
          for (const [planKey, planRule] of Object.entries(defaultPlanRules)) {
            if (planCode.includes(planKey)) {
              rule = planRule;
              break;
            }
          }
          
          // Si c'est TRAVCO mais qu'on n'a pas trouvé de règle spécifique
          if (isTravco && rule.source !== "travco_rate") {
            rule = defaultPlanRules["travco-bb-flex-net"];
          }
        }
        
        // Pour les estimations, on applique un taux légèrement différent pour TRAVCO
        const estimatedBaseRate = isTravco ? baseRate * 0.9 : baseRate;
        const calculatedRate = (estimatedBaseRate * rule.multiplier) + rule.offset;
        
        const displayName = `${partnerData.partnerName} - ${partnerData.planName}`;
        entry[displayName] = Math.round(calculatedRate);
      }
      
      data.push(entry);
    }
    
    // Passer au jour suivant
    currentDate = addDays(currentDate, 1);
  }
  
  return data;
};
