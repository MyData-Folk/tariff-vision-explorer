
// Type definitions for our Supabase data models

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
