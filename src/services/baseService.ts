
// Core service functionality and common utilities

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// This function will be called by the DatabaseManager component
export const getTables = async (schema: string = 'public'): Promise<string[]> => {
  try {
    // Simuler la fonction RPC car elle n'existe pas encore dans la base de données
    if (schema === 'public') {
      return [
        'categories',
        'competitor_prices',
        'daily_base_rates',
        'occupancy_rates',
        'optimized_prices',
        'partner_adjustments',
        'partner_plans',
        'partners',
        'plan_rules',
        'plans'
      ];
    }
    return [];
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
};
