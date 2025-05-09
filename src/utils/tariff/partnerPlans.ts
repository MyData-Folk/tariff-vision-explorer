
import { supabase } from "@/integrations/supabase/client";
import { Partner, Plan } from "@/services/types";

// Interface pour les associations partenaire-plan
export interface PartnerPlan {
  partner_id: string;
  plan_id: string;
}

// Récupère toutes les associations partenaire-plan de la base de données
export const getPartnerPlans = async (): Promise<PartnerPlan[]> => {
  const { data, error } = await supabase
    .from('partner_plans')
    .select('*');

  if (error) {
    console.error("Erreur lors de la récupération des associations partenaire-plan:", error);
    return [];
  }
  
  return data || [];
};

// Récupère tous les plans disponibles pour un partenaire spécifique
export const getPlansForPartner = async (partnerId: string): Promise<Plan[]> => {
  const { data, error } = await supabase
    .from('partner_plans')
    .select('plan_id')
    .eq('partner_id', partnerId);

  if (error) {
    console.error("Erreur lors de la récupération des plans du partenaire:", error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  const planIds = data.map(item => item.plan_id);
  
  const { data: plansData, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .in('id', planIds);
  
  if (plansError) {
    console.error("Erreur lors de la récupération des détails des plans:", plansError);
    return [];
  }
  
  return plansData || [];
};

// Fonction pour créer un objet de mapping entre partenaires et plans
export const createPartnerPlansMapping = (
  partners: Partner[],
  plans: Plan[],
  partnerPlansAssociations: PartnerPlan[]
): Record<string, Plan[]> => {
  const planMapping: Record<string, Plan[]> = {};
  
  partners.forEach(partner => {
    const partnerAssociations = partnerPlansAssociations.filter(
      assoc => assoc.partner_id === partner.id
    );
    
    const associatedPlans = partnerAssociations
      .map(assoc => plans.find(plan => plan.id === assoc.plan_id))
      .filter(Boolean) as Plan[];
    
    planMapping[partner.id] = associatedPlans;
  });
  
  return planMapping;
};
