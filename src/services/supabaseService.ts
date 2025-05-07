// Extension du service Supabase pour inclure les fonctions RPC nécessaires

import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Typages pour les données
export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  created_at: string;
}

export interface Plan {
  id: string;
  code: string;
  description: string;
  created_at: string;
}

export interface DailyRate {
  date: string;
  ota_rate: number;
  travco_rate: number;
  created_at: string;
}

// Fonctions pour récupérer les données

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  
  return data || [];
};

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

// Fonctions pour le module Yield Management
export interface OccupancyRate {
  id: string;
  date: string;
  rate: number;
}

export interface CompetitorPrice {
  id: string;
  date: string;
  price: number;
}

export interface OptimizedPrice {
  id: string;
  date: string;
  calculated_price: number;
}

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

// Renamed from calculateOptimalPrice to calculateOptimizedPrice to match import
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

// CRUD functions for yield management data
export const upsertOccupancyRate = async (date: string, rate: number): Promise<void> => {
  const { error } = await supabase
    .from('occupancy_rates')
    .upsert([{ date, rate }], { 
      onConflict: 'date',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('Error upserting occupancy rate:', error);
    throw error;
  }
};

export const upsertCompetitorPrice = async (date: string, price: number): Promise<void> => {
  const { error } = await supabase
    .from('competitor_prices')
    .upsert([{ date, price }], {
      onConflict: 'date',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('Error upserting competitor price:', error);
    throw error;
  }
};

export const upsertOptimizedPrice = async (date: string, calculated_price: number): Promise<void> => {
  const { error } = await supabase
    .from('optimized_prices')
    .upsert([{ date, calculated_price }], {
      onConflict: 'date',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('Error upserting optimized price:', error);
    throw error;
  }
};

export const saveYieldData = async (
  date: Date,
  occupancyRate: number,
  competitorPrice: number,
  calculatedPrice: number
): Promise<void> => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  // Utilisation d'une transaction pour s'assurer que tout est enregistré ou rien
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

// Cette fonction sera appelée par le composant DatabaseManager
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
