
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

// Add the missing CRUD operations for partners
export const createPartner = async (partner: Omit<Partner, 'id' | 'created_at'>): Promise<Partner> => {
  const { data, error } = await supabase
    .from('partners')
    .insert(partner)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating partner:', error);
    throw error;
  }
  
  return data;
};

export const updatePartner = async (id: string, partner: Partial<Partner>): Promise<Partner> => {
  const { data, error } = await supabase
    .from('partners')
    .update(partner)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating partner:', error);
    throw error;
  }
  
  return data;
};

export const deletePartner = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting partner:', error);
    throw error;
  }
};

