
import { supabase } from "@/integrations/supabase/client";

// Interface pour les règles de plan
export interface PlanRule {
  plan_id: string;
  base_source: string;
  steps: any[];
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
