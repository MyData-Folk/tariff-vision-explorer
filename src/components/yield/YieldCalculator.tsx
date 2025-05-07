
import { format } from "date-fns";

// Fonction pour formater les données pour les graphiques
export const formatDataForLineChart = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  return data.map(item => ({
    date: format(new Date(item.date), 'yyyy-MM-dd'),
    value: Number(item.price || item.rate || item.calculated_price || 0)
  }));
};

// Autres fonctions utilitaires pour le module Yield
