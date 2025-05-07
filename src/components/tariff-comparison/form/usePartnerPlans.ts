
import { useEffect, useState } from "react";
import { Partner, Plan } from "@/services/types";
import { supabase } from "@/integrations/supabase/client";

export function usePartnerPlans(allPartners: Partner[], allPlans: Plan[]) {
  const [partnerPlans, setPartnerPlans] = useState<{[key: string]: Plan[]}>({});
  
  // Load partner plans associations
  useEffect(() => {
    const loadPartnerPlans = async () => {
      try {
        // Get partner-plan associations
        const { data: associations, error } = await supabase
          .from('partner_plans')
          .select('*');
          
        if (error) throw error;
        
        // Create partner -> plans mapping
        const planMapping: {[key: string]: Plan[]} = {};
        
        allPartners.forEach(partner => {
          const partnerAssociations = associations?.filter(assoc => assoc.partner_id === partner.id) || [];
          const plans = partnerAssociations.map(assoc => 
            allPlans.find(plan => plan.id === assoc.plan_id)
          ).filter(Boolean) as Plan[];
          
          planMapping[partner.id] = plans.length > 0 ? plans : [];
        });
        
        setPartnerPlans(planMapping);
      } catch (error) {
        console.error("Erreur lors du chargement des plans par partenaire:", error);
      }
    };
    
    if (allPartners.length > 0 && allPlans.length > 0) {
      loadPartnerPlans();
    }
  }, [allPartners, allPlans]);

  return partnerPlans;
}
