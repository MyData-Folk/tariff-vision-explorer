
import { format } from "date-fns";

// Fonction pour formater les données pour les graphiques
export const formatDataForLineChart = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  return data.map(item => ({
    date: format(new Date(item.date), 'yyyy-MM-dd'),
    value: Number(item.price || item.rate || item.calculated_price || 0)
  }));
};

// Composant YieldCalculator pour exporter correctement
export const YieldCalculator = () => {
  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-semibold">Calculateur de Rendement</h2>
      <p className="text-muted-foreground">
        Utilisez l'outil de calcul pour analyser les rendements basés sur différentes stratégies tarifaires.
      </p>
    </div>
  );
};

// Export par défaut pour compatibilité
export default YieldCalculator;
