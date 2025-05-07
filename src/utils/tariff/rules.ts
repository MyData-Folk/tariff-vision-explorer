
import { supabase } from "@/integrations/supabase/client";

// Interface pour les règles de plan
export interface PlanRule {
  id?: string;
  plan_id: string;
  base_source: string;
  created_at?: string;
  steps: any[]; // Type plus spécifique pour les étapes
}

// Interface pour les règles de catégorie
export interface CategoryRule {
  id?: string;
  category_id: string;
  formula_type: string;
  base_source: string;
  formula_multiplier: number;
  formula_offset: number;
  created_at?: string;
}

// Interface pour les ajustements partenaires
export interface PartnerAdjustment {
  id?: string;
  partner_id: string;
  adjustment_type: string;
  adjustment_value: string;
  description: string;
  ui_control: string;
  default_checked: boolean;
  associated_plan_filter?: string;
  created_at?: string;
}

// Récupère toutes les règles de plans de la base de données
export const getPlanRules = async (): Promise<PlanRule[]> => {
  const { data: planRulesData, error: planRulesError } = await supabase
    .from('plan_rules')
    .select('*');

  if (planRulesError) {
    console.error("Erreur lors de la récupération des règles de plan:", planRulesError);
    return [];
  }
  
  return planRulesData || [];
};

// Récupère toutes les règles de catégorie de la base de données
export const getCategoryRules = async (): Promise<CategoryRule[]> => {
  const { data: categoryRulesData, error: categoryRulesError } = await supabase
    .from('category_rules')
    .select('*');

  if (categoryRulesError) {
    console.error("Erreur lors de la récupération des règles de catégorie:", categoryRulesError);
    return [];
  }
  
  return categoryRulesData || [];
};

// Récupère tous les ajustements partenaires de la base de données
export const getPartnerAdjustments = async (): Promise<PartnerAdjustment[]> => {
  const { data: adjustmentsData, error: adjustmentsError } = await supabase
    .from('partner_adjustments')
    .select('*');

  if (adjustmentsError) {
    console.error("Erreur lors de la récupération des ajustements partenaires:", adjustmentsError);
    return [];
  }
  
  return adjustmentsData || [];
};

// Récupère les plans associés à un partenaire
export const getPartnerPlans = async (partnerId: string): Promise<string[]> => {
  const { data: partnerPlansData, error: partnerPlansError } = await supabase
    .from('partner_plans')
    .select('plan_id')
    .eq('partner_id', partnerId);

  if (partnerPlansError) {
    console.error("Erreur lors de la récupération des plans partenaires:", partnerPlansError);
    return [];
  }
  
  return (partnerPlansData || []).map(item => item.plan_id);
};

// Applique les règles de calcul pour une catégorie donnée
export const applyCategoryRules = (baseRate: number, categoryRule: CategoryRule): number => {
  if (!categoryRule) return baseRate;
  
  // Appliquer la formule selon le type
  switch (categoryRule.formula_type) {
    case 'multiplicative':
      return baseRate * categoryRule.formula_multiplier + categoryRule.formula_offset;
    case 'additive':
      return baseRate + categoryRule.formula_offset;
    default:
      return baseRate * categoryRule.formula_multiplier + categoryRule.formula_offset;
  }
};

// Applique les règles de calcul pour un plan donné
export const applyPlanRules = (baseRate: number, planRule: PlanRule): number => {
  if (!planRule || !planRule.steps || !Array.isArray(planRule.steps)) return baseRate;
  
  let calculatedRate = baseRate;
  
  // Appliquer chaque étape dans l'ordre
  planRule.steps.forEach(step => {
    switch (step.type) {
      case 'multiply':
        calculatedRate *= parseFloat(step.value);
        break;
      case 'add':
        calculatedRate += parseFloat(step.value);
        break;
      case 'subtract':
        calculatedRate -= parseFloat(step.value);
        break;
      case 'divide':
        if (parseFloat(step.value) !== 0) {
          calculatedRate /= parseFloat(step.value);
        }
        break;
    }
  });
  
  return calculatedRate;
};

// Applique un ajustement partenaire
export const applyPartnerAdjustment = (baseRate: number, adjustment: PartnerAdjustment): number => {
  if (!adjustment) return baseRate;
  
  const value = parseFloat(adjustment.adjustment_value);
  
  switch (adjustment.adjustment_type) {
    case 'percentage':
      return baseRate * (1 + value / 100);
    case 'fixed':
      return baseRate + value;
    case 'commission':
      return baseRate * (1 - value / 100);
    default:
      return baseRate;
  }
};
