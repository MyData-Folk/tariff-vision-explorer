// Services for yield management operations

import { supabase } from "@/integrations/supabase/client";
import { OccupancyRate, CompetitorPrice, OptimizedPrice, Partner, Plan } from "./types";
import { format } from "date-fns";

// Data structures for optimized lookups
let occupancyRatesMap = new Map<string, OccupancyRate>();
let competitorPricesMap = new Map<string, CompetitorPrice>();
let optimizedPricesMap = new Map<string, OptimizedPrice>();
let plansMap = new Map<string, Plan>();
let partnersMap = new Map<string, Partner>();
let partnerPlansMap = new Map<string, Plan[]>();

// Function to initialize data maps
export const initializeMaps = async (startDate: string, endDate: string) => {
  try {
    // Fetch all required data
    const occupancyRates = await fetchOccupancyRates(startDate, endDate);
    const competitorPrices = await fetchCompetitorPrices(startDate, endDate);
    const optimizedPrices = await fetchOptimizedPrices(startDate, endDate);
    const plans = await fetchAllPlans();
    const partners = await fetchPartners();
    
    // Populate maps
    occupancyRatesMap.clear();
    competitorPricesMap.clear();
    optimizedPricesMap.clear();
    plansMap.clear();
    partnersMap.clear();
    partnerPlansMap.clear();
    
    occupancyRates.forEach(rate => {
      occupancyRatesMap.set(rate.date, rate);
    });
    
    competitorPrices.forEach(price => {
      competitorPricesMap.set(price.date, price);
    });
    
    optimizedPrices.forEach(price => {
      optimizedPricesMap.set(price.date, price);
    });
    
    plans.forEach(plan => {
      plansMap.set(plan.id, plan);
    });
    
    partners.forEach(partner => {
      partnersMap.set(partner.id, partner);
    });
    
    // Initialize partner-plans associations
    await loadPartnerPlansAssociations();
    
    console.log("Data maps initialized successfully");
  } catch (error) {
    console.error("Error initializing data maps:", error);
    throw error;
  }
};

// Function to load partner-plans associations
export const loadPartnerPlansAssociations = async () => {
  try {
    const { data: associations, error } = await supabase
      .from('partner_plans')
      .select('*');
    
    if (error) throw error;
    
    // Group plans by partner ID
    (associations || []).forEach(association => {
      const partnerId = association.partner_id;
      const planId = association.plan_id;
      
      const plan = plansMap.get(planId);
      if (!plan) return; // Skip if plan not found
      
      // Get or create the plans array for this partner
      if (!partnerPlansMap.has(partnerId)) {
        partnerPlansMap.set(partnerId, []);
      }
      
      const partnerPlans = partnerPlansMap.get(partnerId);
      if (partnerPlans) {
        partnerPlans.push(plan);
      }
    });
    
    console.log("Partner-plans associations loaded successfully");
  } catch (error) {
    console.error("Error loading partner-plans associations:", error);
    throw error;
  }
};

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

// Function to fetch all partners
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

// Function to fetch all plans
export const fetchAllPlans = async (): Promise<Plan[]> => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('code');
  
  if (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
  
  return data || [];
};

// Function to fetch plans for a specific partner
export const fetchPlansForPartner = async (partnerId: string): Promise<Plan[]> => {
  try {
    // If maps are initialized, use them for faster lookup
    if (partnerPlansMap.size > 0 && partnerPlansMap.has(partnerId)) {
      return partnerPlansMap.get(partnerId) || [];
    }
    
    // Otherwise, fetch from database
    const { data, error } = await supabase
      .from('partner_plans')
      .select('plan_id')
      .eq('partner_id', partnerId);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    const planIds = data.map(item => item.plan_id);
    
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .in('id', planIds)
      .order('code');
    
    if (plansError) throw plansError;
    
    return plansData || [];
  } catch (error) {
    console.error('Error fetching plans for partner:', error);
    throw error;
  }
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

// CRUD operations for yield management data
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
  
  // Update the map
  if (occupancyRatesMap.has(date)) {
    const record = occupancyRatesMap.get(date);
    if (record) {
      record.rate = rate;
    }
  } else {
    occupancyRatesMap.set(date, { 
      id: '',  // Will be updated when we fetch the data next time
      date, 
      rate 
    });
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
  
  // Update the map
  if (competitorPricesMap.has(date)) {
    const record = competitorPricesMap.get(date);
    if (record) {
      record.price = price;
    }
  } else {
    competitorPricesMap.set(date, { 
      id: '',  // Will be updated when we fetch the data next time
      date, 
      price 
    });
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
  
  // Update the map
  if (optimizedPricesMap.has(date)) {
    const record = optimizedPricesMap.get(date);
    if (record) {
      record.calculated_price = calculated_price;
    }
  } else {
    optimizedPricesMap.set(date, { 
      id: '',  // Will be updated when we fetch the data next time
      date, 
      calculated_price 
    });
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
    // Initialize maps if not already done
    if (occupancyRatesMap.size === 0) {
      await initializeMaps(formattedDate, formattedDate);
    }
    
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
