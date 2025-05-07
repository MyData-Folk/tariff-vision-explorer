
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DailyRate } from "@/services/types";
import { ChartData, SelectedPartner } from "@/components/tariff-comparison/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  getPlanRules, 
  getCategoryRules,
  applyCategoryRules,
  applyPlanRules,
  PlanRule,
  CategoryRule
} from "./rules";

// Transforme les données pour le graphique
export const transformDataForChart = async (
  baseRates: DailyRate[], 
  dateRange: DateRange, 
  selectedPartners: SelectedPartner[]
): Promise<ChartData[]> => {
  if (!dateRange.from || !dateRange.to || selectedPartners.length === 0) {
    return [];
  }

  // Récupérer les règles de plan et de catégorie depuis la base de données
  const planRulesData = await getPlanRules();
  const categoryRulesData = await getCategoryRules();
  
  const data: ChartData[] = [];
  
  // Créer un mappage pour un accès rapide aux tarifs de base
  const ratesMap = new Map();
  baseRates.forEach(rate => {
    ratesMap.set(rate.date, {
      ota_rate: rate.ota_rate,
      travco_rate: rate.travco_rate
    });
  });
  
  // Créer un mappage des règles de plan par ID de plan
  const planRulesMap = new Map<string, PlanRule>();
  planRulesData.forEach(rule => {
    planRulesMap.set(rule.plan_id, rule);
  });
  
  // Créer un mappage des règles de catégorie par ID de catégorie
  const categoryRulesMap = new Map<string, CategoryRule>();
  categoryRulesData.forEach(rule => {
    categoryRulesMap.set(rule.category_id, rule);
  });
  
  // Règles par défaut pour les plans standard
  const defaultPlanRules: {[key: string]: { source: string, steps: any[] }} = {
    // Plans standard basés sur OTA-RO-FLEX
    "ota-ro-flex": { 
      source: "ota_rate", 
      steps: [{ type: 'multiply', value: '1.0' }] 
    },
    "ota-ro-flex-net": { 
      source: "ota_rate", 
      steps: [{ type: 'multiply', value: '0.85' }] 
    },
    "ota-ro-nrf": { 
      source: "ota_rate", 
      steps: [{ type: 'multiply', value: '1.15' }] 
    },
    "ota-ro-nrf-net": { 
      source: "ota_rate", 
      steps: [{ type: 'multiply', value: '0.98' }] 
    },
    
    // Plans TRAVCO basés sur TRAVCO-BB-FLEX-NET
    "travco": { 
      source: "travco_rate", 
      steps: [{ type: 'multiply', value: '1.0' }] 
    },
    "travco-bb-flex-net": { 
      source: "travco_rate", 
      steps: [{ type: 'multiply', value: '1.0' }] 
    },
    "travco-bb-nrf-net": { 
      source: "travco_rate", 
      steps: [{ type: 'multiply', value: '1.15' }] 
    },
  };
  
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
        let planRule: PlanRule | null = null;
        
        // D'abord, essayer d'utiliser les règles de la base de données
        if (planRulesMap.has(partnerData.planId)) {
          planRule = planRulesMap.get(partnerData.planId)!;
        } else {
          // Sinon, utiliser les règles codées en dur
          for (const [planKey, defaultRule] of Object.entries(defaultPlanRules)) {
            if (planCode.includes(planKey)) {
              planRule = {
                plan_id: partnerData.planId,
                base_source: defaultRule.source,
                steps: defaultRule.steps
              };
              break;
            }
          }
          
          // Si c'est TRAVCO mais qu'on n'a pas trouvé de règle spécifique
          if (isTravco && (!planRule || planRule.base_source !== "travco_rate")) {
            planRule = {
              plan_id: partnerData.planId,
              base_source: "travco_rate",
              steps: defaultPlanRules["travco-bb-flex-net"].steps
            };
          }
          
          // Si on n'a toujours pas de règle, utiliser OTA-RO-FLEX par défaut
          if (!planRule) {
            planRule = {
              plan_id: partnerData.planId,
              base_source: "ota_rate",
              steps: defaultPlanRules["ota-ro-flex"].steps
            };
          }
        }
        
        // Déterminer le tarif de base à utiliser
        const baseSource = planRule?.base_source || "ota_rate";
        const baseRate = baseSource === "travco_rate" ? rates.travco_rate : rates.ota_rate;
        
        // Appliquer les règles du plan
        const calculatedRate = applyPlanRules(Number(baseRate), planRule!);
        
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
        
        // Chercher les règles spécifiques pour ce plan (même logique que ci-dessus)
        let planRule: PlanRule | null = null;
        
        if (planRulesMap.has(partnerData.planId)) {
          planRule = planRulesMap.get(partnerData.planId)!;
        } else {
          for (const [planKey, defaultRule] of Object.entries(defaultPlanRules)) {
            if (planCode.includes(planKey)) {
              planRule = {
                plan_id: partnerData.planId,
                base_source: defaultRule.source,
                steps: defaultRule.steps
              };
              break;
            }
          }
          
          if (isTravco && (!planRule || planRule.base_source !== "travco_rate")) {
            planRule = {
              plan_id: partnerData.planId,
              base_source: "travco_rate",
              steps: defaultPlanRules["travco-bb-flex-net"].steps
            };
          }
          
          if (!planRule) {
            planRule = {
              plan_id: partnerData.planId,
              base_source: "ota_rate",
              steps: defaultPlanRules["ota-ro-flex"].steps
            };
          }
        }
        
        // Pour les estimations, on applique un taux légèrement différent pour TRAVCO
        const estimatedBaseRate = isTravco ? baseRate * 0.9 : baseRate;
        
        // Appliquer les règles du plan
        const calculatedRate = applyPlanRules(estimatedBaseRate, planRule!);
        
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

// Calcule le tarif pour une catégorie de chambre selon le tarif de référence Double Classique
export const calculateCategoryRate = (baseRate: number, categoryId: string, referenceId: string, categoryRules: CategoryRule[]): number => {
  // Si la catégorie demandée est la référence, on retourne le tarif de base
  if (categoryId === referenceId) {
    return baseRate;
  }
  
  // Trouver les règles pour la catégorie demandée
  const categoryRule = categoryRules.find(rule => rule.category_id === categoryId);
  
  if (!categoryRule) {
    console.warn(`Aucune règle trouvée pour la catégorie ${categoryId}`);
    return baseRate;
  }
  
  // Appliquer les règles de la catégorie
  return applyCategoryRules(baseRate, categoryRule);
};

// Calcule le tarif pour un plan tarifaire selon le tarif de référence OTA-RO-FLEX
export const calculatePlanRate = (baseRate: number, planId: string, referencePlanId: string, planRules: PlanRule[]): number => {
  // Si le plan demandé est la référence, on retourne le tarif de base
  if (planId === referencePlanId) {
    return baseRate;
  }
  
  // Trouver les règles pour le plan demandé
  const planRule = planRules.find(rule => rule.plan_id === planId);
  
  if (!planRule) {
    console.warn(`Aucune règle trouvée pour le plan ${planId}`);
    return baseRate;
  }
  
  // Appliquer les règles du plan
  return applyPlanRules(baseRate, planRule);
};
