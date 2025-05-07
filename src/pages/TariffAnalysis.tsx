
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPartners } from "@/services/partnerService";
import { fetchDailyBaseRates } from "@/services/rateService";
import { Partner, Plan } from "@/services/types";
import { supabase } from "@/integrations/supabase/client";

interface CategoryRule {
  id: string;
  category_id: string;
  formula_type: string;
  base_source: string;
  formula_multiplier: number;
  formula_offset: number;
}

const TariffAnalysis = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Charger les partenaires
        const partnersData = await fetchPartners();
        setPartners(partnersData);

        // Charger les plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*');
          
        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Charger les règles de catégorie
        const { data: rulesData, error: rulesError } = await supabase
          .from('category_rules')
          .select('*');
          
        if (rulesError) throw rulesError;
        setCategoryRules(rulesData || []);

      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analyse tarifaire</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Analyse des tarifs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement des données...</p>
          ) : (
            <div className="space-y-6">
              <div className="rounded-md border p-4">
                <h3 className="font-semibold mb-2">Règles de calcul des tarifs</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Partenaires standards</p>
                    <p>Tarif de référence: <strong>OTA-RO-FLEX</strong> (daily_base_rate.ota_rate)</p>
                  </div>
                  <div>
                    <p className="font-medium">TRAVCO</p>
                    <p>Tarif de référence: <strong>TRAVCO-BB-FLEX-NET</strong> (daily_base_rate.travco_rate)</p>
                  </div>
                  <div>
                    <p className="font-medium">Règles de calcul par catégorie</p>
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type de formule</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Source de base</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Multiplicateur</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Offset</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {categoryRules.map((rule) => (
                            <tr key={rule.id}>
                              <td className="px-4 py-2 text-sm">{rule.formula_type}</td>
                              <td className="px-4 py-2 text-sm">{rule.base_source}</td>
                              <td className="px-4 py-2 text-sm">{rule.formula_multiplier}</td>
                              <td className="px-4 py-2 text-sm">{rule.formula_offset}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-2">Partenaires ({partners.length})</h3>
                  <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {partners.map((partner) => (
                      <li key={partner.id} className="text-sm p-1 hover:bg-muted">
                        {partner.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-2">Plans tarifaires ({plans.length})</h3>
                  <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {plans.map((plan) => (
                      <li key={plan.id} className="text-sm p-1 hover:bg-muted">
                        <strong>{plan.code}</strong> - {plan.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffAnalysis;
