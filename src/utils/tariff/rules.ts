
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// Interface pour les règles de plan
export interface PlanRule {
  id?: string;
  plan_id: string;
  base_source: string;
  created_at?: string;
  steps: Json | any[]; // Type pour les étapes, adapté pour travailler avec Json
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
  
  // Transformation des données pour s'assurer que steps est toujours un tableau
  return (planRulesData || []).map(rule => ({
    id: rule.id,
    plan_id: rule.plan_id,
    base_source: rule.base_source,
    created_at: rule.created_at,
    steps: Array.isArray(rule.steps) ? rule.steps : 
           (typeof rule.steps === 'object' && rule.steps !== null) ? 
           Object.values(rule.steps) : []
  }));
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
    case 'fixed':
      return categoryRule.formula_offset; // Utiliser une valeur fixe indépendamment de la base
    default:
      return baseRate * categoryRule.formula_multiplier + categoryRule.formula_offset;
  }
};

// Applique les règles de calcul pour un plan donné
export const applyPlanRules = (baseRate: number, planRule: PlanRule): number => {
  if (!planRule || !planRule.steps) return baseRate;
  
  let calculatedRate = baseRate;
  
  // Convertir steps en tableau si ce n'est pas déjà le cas
  const stepsArray = Array.isArray(planRule.steps) ? planRule.steps : 
                    (typeof planRule.steps === 'object' && planRule.steps !== null) ? 
                    Object.values(planRule.steps) : [];
  
  // Appliquer chaque étape dans l'ordre
  stepsArray.forEach(step => {
    if (!step || typeof step !== 'object') return;
    
    const type = step.type;
    const value = parseFloat(step.value);
    
    if (isNaN(value)) return;
    
    switch (type) {
      case 'multiply':
        calculatedRate *= value;
        break;
      case 'add':
        calculatedRate += value;
        break;
      case 'subtract':
        calculatedRate -= value;
        break;
      case 'divide':
        if (value !== 0) {
          calculatedRate /= value;
        }
        break;
      case 'percentage':
        calculatedRate = calculatedRate * (1 + value / 100);
        break;
    }
  });
  
  return calculatedRate;
};

// Applique un ajustement partenaire
export const applyPartnerAdjustment = (baseRate: number, adjustment: PartnerAdjustment): number => {
  if (!adjustment) return baseRate;
  
  const value = parseFloat(adjustment.adjustment_value);
  if (isNaN(value)) return baseRate;
  
  switch (adjustment.adjustment_type) {
    case 'percentage':
      return baseRate * (1 + value / 100);
    case 'fixed':
      return baseRate + value;
    case 'commission':
      return baseRate * (1 - value / 100); // Interpréter comme une remise sur le tarif
    case 'promo_filter':
      // Pour les filtres conditionnels, il faudrait une logique plus complexe
      // Ici on suppose qu'un filtrage a déjà été fait et on retourne simplement le tarif
      return baseRate;
    default:
      return baseRate;
  }
};
