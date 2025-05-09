
import React from 'react';
import { CategoryRule, PlanRule } from '@/utils/tariff/rules';
import { Partner, Plan } from '@/services/types';

interface RulesInfoProps {
  categoryRules: CategoryRule[];
  partners: Partner[];
  plans: Plan[];
  getPlansForPartner: (partnerId: string) => Plan[];
}

const RulesInfo: React.FC<RulesInfoProps> = ({ 
  categoryRules, 
  partners, 
  plans, 
  getPlansForPartner 
}) => {
  return (
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
              <li key={partner.id} className="p-2 border-b last:border-0">
                <p className="font-medium">{partner.name}</p>
                <ul className="mt-1 pl-4">
                  {getPlansForPartner(partner.id).map(plan => (
                    <li key={plan.id} className="text-sm py-1">
                      <span className="font-mono bg-muted px-1 rounded">{plan.code}</span>
                    </li>
                  ))}
                  {getPlansForPartner(partner.id).length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun plan associé</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Plans tarifaires disponibles ({plans.length})</h3>
          <ul className="space-y-1 max-h-60 overflow-y-auto">
            {plans.map((plan) => (
              <li key={plan.id} className="text-sm p-1 hover:bg-muted flex items-center">
                <span className="font-mono bg-muted px-1 rounded mr-2">{plan.code}</span>
                <span className="text-xs text-muted-foreground">{plan.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RulesInfo;
