
import { CategoryRule, PlanRule, applyCategoryRules, applyPlanRules } from "./rules";

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
