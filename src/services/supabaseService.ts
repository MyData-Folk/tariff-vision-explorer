
import { supabase } from "@/integrations/supabase/client";

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

export interface DailyBaseRate {
  date: string;
  ota_rate: number;
  travco_rate: number;
  created_at: string;
}

export interface PartnerPlan {
  partner_id: string;
  plan_id: string;
  created_at: string;
}

export interface PlanRule {
  id: string;
  plan_id: string;
  base_source: string;
  steps: any;
  created_at: string;
}

export interface CategoryRule {
  id: string;
  category_id: string;
  formula_type: string;
  formula_multiplier: number;
  formula_offset: number;
  base_source: string;
  created_at: string;
}

export interface PartnerAdjustment {
  id: string;
  partner_id: string;
  description: string;
  adjustment_type: string;
  adjustment_value: string;
  ui_control: string;
  associated_plan_filter: string | null;
  default_checked: boolean;
  created_at: string;
}

export interface OccupancyRate {
  id: string;
  date: string;
  rate: number;
  created_at: string | null;
}

export interface CompetitorPrice {
  id: string;
  date: string;
  price: number;
  created_at: string | null;
}

export interface OptimizedPrice {
  id: string;
  date: string;
  calculated_price: number;
  created_at: string | null;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchPartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
}

export async function fetchPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
}

export async function fetchPartnerPlans(): Promise<PartnerPlan[]> {
  try {
    const { data, error } = await supabase
      .from('partner_plans')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching partner plans:', error);
    return [];
  }
}

export async function fetchDailyBaseRates(startDate: string, endDate: string): Promise<DailyBaseRate[]> {
  try {
    const { data, error } = await supabase
      .from('daily_base_rates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching daily base rates:', error);
    return [];
  }
}

export async function fetchPlanRules(): Promise<PlanRule[]> {
  try {
    const { data, error } = await supabase
      .from('plan_rules')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plan rules:', error);
    return [];
  }
}

export async function fetchCategoryRules(): Promise<CategoryRule[]> {
  try {
    const { data, error } = await supabase
      .from('category_rules')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching category rules:', error);
    return [];
  }
}

export async function fetchPartnerAdjustments(): Promise<PartnerAdjustment[]> {
  try {
    const { data, error } = await supabase
      .from('partner_adjustments')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching partner adjustments:', error);
    return [];
  }
}

// Nouvelles fonctions pour le module Yield

export async function fetchOccupancyRates(startDate: string, endDate: string): Promise<OccupancyRate[]> {
  try {
    const { data, error } = await supabase
      .from('occupancy_rates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching occupancy rates:', error);
    return [];
  }
}

export async function fetchCompetitorPrices(startDate: string, endDate: string): Promise<CompetitorPrice[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_prices')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching competitor prices:', error);
    return [];
  }
}

export async function fetchOptimizedPrices(startDate: string, endDate: string): Promise<OptimizedPrice[]> {
  try {
    const { data, error } = await supabase
      .from('optimized_prices')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching optimized prices:', error);
    return [];
  }
}

export async function upsertOccupancyRate(date: string, rate: number): Promise<OccupancyRate | null> {
  try {
    const { data, error } = await supabase
      .from('occupancy_rates')
      .upsert({ date, rate }, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting occupancy rate:', error);
    return null;
  }
}

export async function upsertCompetitorPrice(date: string, price: number): Promise<CompetitorPrice | null> {
  try {
    const { data, error } = await supabase
      .from('competitor_prices')
      .upsert({ date, price }, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting competitor price:', error);
    return null;
  }
}

export async function upsertOptimizedPrice(date: string, calculated_price: number): Promise<OptimizedPrice | null> {
  try {
    const { data, error } = await supabase
      .from('optimized_prices')
      .upsert({ date, calculated_price }, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting optimized price:', error);
    return null;
  }
}

// Fonction utilitaire pour calculer le prix optimisé en fonction du taux d'occupation
export function calculateOptimizedPrice(occupancyRate: number, competitorPrice: number): number {
  if (occupancyRate >= 80) {
    return competitorPrice * 0.95; // -5% → Demande forte
  } else if (occupancyRate >= 60) {
    return competitorPrice * 0.85; // -15% → Demande moyenne
  } else {
    return competitorPrice * 0.70; // -30% → Faible demande
  }
}
