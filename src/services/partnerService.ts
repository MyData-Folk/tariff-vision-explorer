
// Services for partner-related operations

import { supabase } from "@/integrations/supabase/client";
import { Partner, Plan } from "./types";

export const fetchPartners = async (): Promise<Partner[]> => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching partners:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchPlans = async (): Promise<Plan[]> => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('description');
  
  if (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
  
  return data || [];
};
