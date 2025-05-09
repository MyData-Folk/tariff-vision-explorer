
// Services for yield management operations

import { supabase } from "@/integrations/supabase/client";
import { OccupancyRate, CompetitorPrice, OptimizedPrice } from "./types";
import { format } from "date-fns";

export const fetchOccupancyRates = async (startDate: string, endDate: string): Promise<OccupancyRate[]> => {
  const { data, error } = await supabase
    .from('occupancy_rates')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) {
    console.error('Error fetching occupancy rates:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchCompetitorPrices = async (startDate: string, endDate: string): Promise<CompetitorPrice[]> => {
  const { data, error } = await supabase
    .from('competitor_prices')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) {
    console.error('Error fetching competitor prices:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchOptimizedPrices = async (startDate: string, endDate: string): Promise<OptimizedPrice[]> => {
  const { data, error } = await supabase
    .from('optimized_prices')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) {
    console.error('Error fetching optimized prices:', error);
    throw error;
  }
  
  return data || [];
};

// Price calculation logic
export const calculateOptimizedPrice = (occupancyRate: number, competitorPrice: number): number => {
  if (occupancyRate >= 80) {
    return Math.round(competitorPrice * 0.95); // -5% → Demande forte
  } else if (occupancyRate >= 60) {
    return Math.round(competitorPrice * 0.85); // -15% → Demande moyenne
  } else {
    return Math.round(competitorPrice * 0.70); // -30% → Faible demande
  }
};

// Keep the old function name for backwards compatibility
export const calculateOptimalPrice = calculateOptimizedPrice;

// CRUD operations for yield management data - Fixed to handle tables without onConflict constraints
export const upsertOccupancyRate = async (date: string, rate: number): Promise<void> => {
  // First check if record exists
  const { data: existingRecord } = await supabase
    .from('occupancy_rates')
    .select('*')
    .eq('date', date)
    .maybeSingle();
    
  if (existingRecord) {
    // Update existing record
    const { error } = await supabase
      .from('occupancy_rates')
      .update({ rate })
      .eq('date', date);
      
    if (error) {
      console.error('Error updating occupancy rate:', error);
      throw error;
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('occupancy_rates')
      .insert([{ date, rate }]);
      
    if (error) {
      console.error('Error inserting occupancy rate:', error);
      throw error;
    }
  }
};

export const upsertCompetitorPrice = async (date: string, price: number): Promise<void> => {
  // First check if record exists
  const { data: existingRecord } = await supabase
    .from('competitor_prices')
    .select('*')
    .eq('date', date)
    .maybeSingle();
    
  if (existingRecord) {
    // Update existing record
    const { error } = await supabase
      .from('competitor_prices')
      .update({ price })
      .eq('date', date);
      
    if (error) {
      console.error('Error updating competitor price:', error);
      throw error;
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('competitor_prices')
      .insert([{ date, price }]);
      
    if (error) {
      console.error('Error inserting competitor price:', error);
      throw error;
    }
  }
};

export const upsertOptimizedPrice = async (date: string, calculated_price: number): Promise<void> => {
  // First check if record exists
  const { data: existingRecord } = await supabase
    .from('optimized_prices')
    .select('*')
    .eq('date', date)
    .maybeSingle();
    
  if (existingRecord) {
    // Update existing record
    const { error } = await supabase
      .from('optimized_prices')
      .update({ calculated_price })
      .eq('date', date);
      
    if (error) {
      console.error('Error updating optimized price:', error);
      throw error;
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('optimized_prices')
      .insert([{ date, calculated_price }]);
      
    if (error) {
      console.error('Error inserting optimized price:', error);
      throw error;
    }
  }
};

export const saveYieldData = async (
  date: Date,
  occupancyRate: number,
  competitorPrice: number,
  calculatedPrice: number
): Promise<void> => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  try {
    // 1. Enregistrer le taux d'occupation
    await upsertOccupancyRate(formattedDate, occupancyRate);
    
    // 2. Enregistrer le prix concurrent
    await upsertCompetitorPrice(formattedDate, competitorPrice);
    
    // 3. Enregistrer le prix optimisé
    await upsertOptimizedPrice(formattedDate, calculatedPrice);
  } catch (error) {
    console.error('Error saving yield data:', error);
    throw error;
  }
};
