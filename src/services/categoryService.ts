
// Services for category-related operations

import { supabase } from "@/integrations/supabase/client";
import { Category } from "./types";

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
