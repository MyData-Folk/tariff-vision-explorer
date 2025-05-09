
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { fetchPartners } from "@/services/partnerService";
import { fetchDailyBaseRates } from "@/services/rateService";
import { Partner, Plan, Category, DailyRate } from "@/services/types";
import { format } from "date-fns";
import { CategoryRule, PlanRule, PartnerAdjustment, getCategoryRules, getPlanRules, getPartnerAdjustments } from "@/utils/tariff/rules";
import { calculateTariff } from "@/utils/tariff/calculator";
import { getPlansForPartner as getPlansForPartnerById } from "@/utils/tariff/partnerPlans";

interface TariffCalculationResult {
  steps: Array<{ description: string; value: number; }>;
  finalRate: number;
}

export const useTariffAnalysis = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Function to get plans for a specific partner
  const getPlansForPartner = (partnerId: string): Plan[] => {
    // Filter plans for the specific partner
    return plans.filter(plan => 
      partnerId && plan.id && 
      partners.find(p => p.id === partnerId)
    );
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load partners
        const partnersData = await fetchPartners();
        setPartners(partnersData);

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Load plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*');
          
        if (plansError) throw plansError;
        setPlans(plansData || []);
        
        // Load category rules via utility
        const categoryRulesData = await getCategoryRules();
        setCategoryRules(categoryRulesData);

        // Load plan rules via utility
        const planRulesData = await getPlanRules();
        setPlanRules(planRulesData);

        // Load partner adjustments via utility
        const partnerAdjustmentsData = await getPartnerAdjustments();
        setPartnerAdjustments(partnerAdjustmentsData);

        // Load base rates for the current week
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

        // Set default values if available
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

  // Update selected plan when partner changes
  useEffect(() => {
    const updateSelectedPlan = async () => {
      if (selectedPartner) {
        try {
          const plans = await getPlansForPartnerById(selectedPartner);
          if (plans.length > 0 && (!selectedPlan || !plans.find(plan => plan.id === selectedPlan))) {
            setSelectedPlan(plans[0].id);
          } else if (plans.length === 0) {
            setSelectedPlan("");
          }
        } catch (error) {
          console.error("Error fetching plans for partner:", error);
          setSelectedPlan("");
        }
      } else {
        setSelectedPlan("");
      }
    };
    
    updateSelectedPlan();
  }, [selectedPartner]);

  // Calculate tariff
  const calculateRate = () => {
    if (!selectedDate || !selectedCategory || !selectedPlan || !selectedPartner) {
      return;
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const dailyRate = dailyRates.get(dateStr);
      
      // Use the calculation utility
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

  return {
    partners,
    plans,
    categories,
    categoryRules,
    planRules,
    partnerAdjustments,
    loading,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    selectedPartner,
    setSelectedPartner,
    selectedPlan,
    setSelectedPlan,
    discount,
    setDiscount,
    calculationResult,
    calculateRate,
    getPlansForPartner
  };
};
