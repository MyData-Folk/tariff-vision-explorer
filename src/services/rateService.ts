
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

// Ajouter cette fonction pour récupérer un seul taux journalier
export const fetchDailyBaseRate = async (date: string): Promise<DailyRate | null> => {
  const { data, error } = await supabase
    .from('daily_base_rates')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not found
      return null;
    }
    console.error('Error fetching daily rate:', error);
    throw error;
  }
  
  return data;
};

// Fonction pour sauvegarder un taux journalier
export const saveDailyBaseRate = async (dailyRate: DailyRate): Promise<void> => {
  const { error } = await supabase
    .from('daily_base_rates')
    .upsert({ 
      date: dailyRate.date,
      ota_rate: dailyRate.ota_rate,
      travco_rate: dailyRate.travco_rate
    });
  
  if (error) {
    console.error('Error saving daily rate:', error);
    throw error;
  }
};
