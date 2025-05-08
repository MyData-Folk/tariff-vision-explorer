
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPartners } from "@/services/partnerService";
import { fetchDailyBaseRates } from "@/services/rateService";
import { Partner, Plan, Category, DailyRate } from "@/services/types";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryRule, PlanRule, PartnerAdjustment, getCategoryRules, getPlanRules, getPartnerAdjustments } from "@/utils/tariff/rules";
import { calculateTariff } from "@/utils/tariff/calculator";

interface PartnerPlan {
  partnerId: string;
  planId: string;
}

interface TariffCalculationResult {
  steps: Array<{ description: string; value: number; }>;
  finalRate: number;
}

const TariffAnalysis = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partnerPlans, setPartnerPlans] = useState<PartnerPlan[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [planRules, setPlanRules] = useState<PlanRule[]>([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState<PartnerAdjustment[]>([]);
  const [dailyRates, setDailyRates] = useState<Map<string, DailyRate>>(new Map());
  const [loading, setLoading] = useState(true);

  // Calculation parameters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  // Calculation result
  const [calculationResult, setCalculationResult] = useState<TariffCalculationResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Charger les partenaires
        const partnersData = await fetchPartners();
        setPartners(partnersData);

        // Charger les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Charger les plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*');
          
        if (plansError) throw plansError;
        setPlans(plansData || []);
        
        // Charger les associations partenaires-plans
        const { data: partnerPlansData, error: partnerPlansError } = await supabase
          .from('partner_plans')
          .select('*');
          
        if (partnerPlansError) throw partnerPlansError;
        
        // Transform the data to match our PartnerPlan interface
        const transformedPartnerPlans = (partnerPlansData || []).map(pp => ({
          partnerId: pp.partner_id,
          planId: pp.plan_id
        }));
        
        setPartnerPlans(transformedPartnerPlans);

        // Charger les règles de catégorie via l'utilitaire
        const categoryRulesData = await getCategoryRules();
        setCategoryRules(categoryRulesData);

        // Charger les règles de plan via l'utilitaire
        const planRulesData = await getPlanRules();
        setPlanRules(planRulesData);

        // Charger les ajustements partenaire via l'utilitaire
        const partnerAdjustmentsData = await getPartnerAdjustments();
        setPartnerAdjustments(partnerAdjustmentsData);

        // Charger les tarifs de base pour la semaine en cours
        const today = new Date();
        const weekLater = new Date();
        weekLater.setDate(weekLater.getDate() + 7);

        const startDate = format(today, 'yyyy-MM-dd');
        const endDate = format(weekLater, 'yyyy-MM-dd');

        const ratesData = await fetchDailyBaseRates(startDate, endDate);
        const ratesMap = new Map();
        ratesData.forEach(rate => {
          ratesMap.set(rate.date, rate);
        });
        setDailyRates(ratesMap);

        // Définir des valeurs par défaut si disponibles
        if (categoriesData && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
        
        if (partnersData && partnersData.length > 0) {
          setSelectedPartner(partnersData[0].id);
        }

      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Mise à jour du plan sélectionné lorsque le partenaire change
  useEffect(() => {
    if (selectedPartner) {
      const partnerPlanIds = getPlansForPartner(selectedPartner).map(plan => plan.id);
      if (partnerPlanIds.length > 0 && (!selectedPlan || !partnerPlanIds.includes(selectedPlan))) {
        setSelectedPlan(partnerPlanIds[0]);
      } else if (partnerPlanIds.length === 0) {
        setSelectedPlan("");
      }
    } else {
      setSelectedPlan("");
    }
  }, [selectedPartner, partnerPlans]);
  
  // Fonction pour récupérer les plans pour un partenaire spécifique
  const getPlansForPartner = (partnerId: string) => {
    // Récupérer les IDs des plans associés à ce partenaire
    const partnerPlanIds = partnerPlans
      .filter(pp => pp.partnerId === partnerId)
      .map(pp => pp.planId);
    
    // Récupérer les plans complets correspondants
    return plans.filter(plan => partnerPlanIds.includes(plan.id));
  };

  // Fonction pour calculer le tarif
  const calculateRate = () => {
    if (!selectedDate || !selectedCategory || !selectedPlan || !selectedPartner) {
      return;
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const dailyRate = dailyRates.get(dateStr);
      
      // Utiliser l'utilitaire de calcul
      const result = calculateTariff(
        {
          date: selectedDate,
          categoryId: selectedCategory,
          planId: selectedPlan,
          partnerId: selectedPartner,
          discount
        },
        dailyRates,
        categoryRules,
        planRules,
        partnerAdjustments,
        categories,
        plans,
        partners
      );

      setCalculationResult(result);
    } catch (error) {
      console.error("Erreur lors du calcul du tarif:", error);
      setCalculationResult(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analyse tarifaire</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculateur de tarif */}
        <Card>
          <CardHeader>
            <CardTitle>Calculateur de tarif</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Chargement des données...</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "d MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partner">Partenaire</Label>
                  <Select
                    value={selectedPartner}
                    onValueChange={setSelectedPartner}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un partenaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plan tarifaire</Label>
                  <Select
                    value={selectedPlan}
                    onValueChange={setSelectedPlan}
                    disabled={!selectedPartner}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPlansForPartner(selectedPartner).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Remise (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>

                <Button onClick={calculateRate} className="w-full mt-4">
                  Calculer le tarif
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultat du calcul */}
        <Card>
          <CardHeader>
            <CardTitle>Résultat du calcul</CardTitle>
          </CardHeader>
          <CardContent>
            {calculationResult ? (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Étapes de calcul</h3>
                  <ul className="space-y-2">
                    {calculationResult.steps.map((step, index) => (
                      <li key={index} className="flex justify-between py-1 border-b last:border-0">
                        <span>{step.description}</span>
                        <span className="font-medium">{step.value.toFixed(2)} €</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Tarif final:</span>
                    <span className="text-2xl font-bold">{calculationResult.finalRate.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p>Aucun calcul effectué</p>
                <p className="text-sm">Remplissez les paramètres et cliquez sur "Calculer le tarif"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information sur les règles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Règles de calcul des tarifs</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TariffAnalysis;
