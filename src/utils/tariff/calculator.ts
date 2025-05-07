
import { DailyRate, Category, Plan, Partner } from "@/services/types";
import { format } from "date-fns";
import { CategoryRule, PlanRule, PartnerAdjustment, applyCategoryRules, applyPlanRules, applyPartnerAdjustment } from "./rules";

interface TariffParams {
  date: Date;
  categoryId: string;
  planId: string;
  partnerId: string;
  baseRate?: number;
  discount?: number;
  selectedAdjustments?: string[];
}

interface TariffCalculationResult {
  baseRate: number;
  afterCategoryRule: number;
  afterPlanRule: number;
  afterPartnerAdjustments: number;
  afterDiscount: number;
  finalRate: number;
  steps: Array<{
    description: string;
    value: number;
  }>;
}

export const calculateTariff = (
  params: TariffParams,
  dailyRates: Map<string, DailyRate>,
  categoryRules: CategoryRule[],
  planRules: PlanRule[],
  partnerAdjustments: PartnerAdjustment[],
  categories: Category[],
  plans: Plan[],
  partners: Partner[]
): TariffCalculationResult => {
  const dateStr = format(params.date, "yyyy-MM-dd");
  const dailyRate = dailyRates.get(dateStr);
  
  // Obtenir le tarif de base
  let baseRate: number;
  if (params.baseRate) {
    baseRate = params.baseRate;
  } else if (dailyRate) {
    baseRate = dailyRate.ota_rate;
  } else {
    // Si pas de tarif disponible, estimer selon jour de semaine
    const isWeekend = [0, 6].includes(params.date.getDay());
    baseRate = isWeekend ? 140 : 120;
  }
  
  // Trouver la règle de catégorie
  const categoryRule = categoryRules.find(rule => rule.category_id === params.categoryId);
  const afterCategoryRule = categoryRule ? applyCategoryRules(baseRate, categoryRule) : baseRate;
  
  // Trouver la règle de plan
  const planRule = planRules.find(rule => rule.plan_id === params.planId);
  const afterPlanRule = planRule ? applyPlanRules(afterCategoryRule, planRule) : afterCategoryRule;
  
  // Appliquer les ajustements partenaire sélectionnés
  let afterPartnerAdjustments = afterPlanRule;
  const applicableAdjustments = partnerAdjustments.filter(
    adj => adj.partner_id === params.partnerId && 
    (!params.selectedAdjustments || params.selectedAdjustments.includes(adj.id!))
  );
  
  applicableAdjustments.forEach(adjustment => {
    afterPartnerAdjustments = applyPartnerAdjustment(afterPartnerAdjustments, adjustment);
  });
  
  // Appliquer la remise
  const discount = params.discount || 0;
  const discountAmount = afterPartnerAdjustments * (discount / 100);
  const afterDiscount = afterPartnerAdjustments - discountAmount;
  
  // Construire les étapes de calcul pour affichage
  const steps = [
    { description: "Tarif de base", value: baseRate },
    { description: "Après règle de catégorie", value: afterCategoryRule },
    { description: "Après règle de plan", value: afterPlanRule }
  ];
  
  if (applicableAdjustments.length > 0) {
    steps.push({ 
      description: "Après ajustements partenaire", 
      value: afterPartnerAdjustments 
    });
  }
  
  if (discount > 0) {
    steps.push({ 
      description: `Après remise (${discount}%)`, 
      value: afterDiscount 
    });
  }
  
  return {
    baseRate,
    afterCategoryRule,
    afterPlanRule,
    afterPartnerAdjustments,
    afterDiscount,
    finalRate: afterDiscount,
    steps
  };
};

// Fonction pour calculer les tarifs pour une période
export const calculatePeriodTariffs = (
  startDate: Date,
  endDate: Date,
  params: Omit<TariffParams, "date">,
  dailyRates: Map<string, DailyRate>,
  categoryRules: CategoryRule[],
  planRules: PlanRule[],
  partnerAdjustments: PartnerAdjustment[],
  categories: Category[],
  plans: Plan[],
  partners: Partner[]
): Map<string, TariffCalculationResult> => {
  const results = new Map<string, TariffCalculationResult>();
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const result = calculateTariff(
      { ...params, date: new Date(currentDate) },
      dailyRates, 
      categoryRules, 
      planRules, 
      partnerAdjustments,
      categories,
      plans,
      partners
    );
    
    results.set(dateStr, result);
    
    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return results;
};
