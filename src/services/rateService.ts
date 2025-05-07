
// Services for rate-related operations

import { supabase } from "@/integrations/supabase/client";
import { DailyRate } from "./types";

export const fetchDailyBaseRates = async (startDate: string, endDate: string): Promise<DailyRate[]> => {
  const { data, error } = await supabase
    .from('daily_base_rates')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) {
    console.error('Error fetching daily rates:', error);
    throw error;
  }
  
  return data || [];
};
