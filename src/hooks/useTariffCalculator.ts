
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category, Partner, Plan, DailyRate } from "@/services/types";
import { format, addDays } from "date-fns";
import { calculateCategoryRate, calculatePlanRate } from "@/utils/tariff/tariffCalculators";
import { CategoryRule, PlanRule, getCategoryRules, getPlanRules } from "@/utils/tariff/rules";

export interface CalculationResult {
  nightlyRates: { date: Date; rate: number }[];
  totalRate: number;
  averageRate: number;
  discount: number;
  totalAfterDiscount: number;
}

export function useTariffCalculator() {
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [nights, setNights] = useState<number>(1);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // States for database data
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [partnerPlans, setPartnerPlans] = useState<{[key: string]: Plan[]}>({});
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [planRules, setPlanRules] = useState<PlanRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
          
        if (categoriesError) throw categoriesError;
        
        // Load partners
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');
          
        if (partnersError) throw partnersError;
        
        // Load plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*');
          
        if (plansError) throw plansError;
        
        // Load partner-plan associations
        const { data: partnerPlansData, error: partnerPlansError } = await supabase
          .from('partner_plans')
          .select('*');
        
        if (partnerPlansError) throw partnerPlansError;
        
        // Get category and plan rules
        const categoryRulesData = await getCategoryRules();
        const planRulesData = await getPlanRules();
        
        setCategories(categoriesData || []);
        setPartners(partnersData || []);
        setPlans(plansData || []);
        setCategoryRules(categoryRulesData);
        setPlanRules(planRulesData);
        
        // Create partner -> plans mapping
        const planMapping: {[key: string]: Plan[]} = {};
        
        (partnersData || []).forEach(partner => {
          const partnerAssociations = (partnerPlansData || []).filter(
            assoc => assoc.partner_id === partner.id
          );
          
          const associatedPlans = partnerAssociations
            .map(assoc => plansData?.find(plan => plan.id === assoc.plan_id))
            .filter(Boolean) as Plan[];
          
          planMapping[partner.id] = associatedPlans.length > 0 ? associatedPlans : [];
        });
        
        setPartnerPlans(planMapping);
        
        // Set default values if available
        if (partnersData && partnersData.length > 0) {
          setSelectedPartner(partnersData[0].id);
          
          // Set default plan based on partner
          if (planMapping[partnersData[0].id]?.length > 0) {
            setSelectedPlan(planMapping[partnersData[0].id][0].id);
          }
        }
        
        if (categoriesData && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Impossible de charger les données nécessaires");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update selected plan when partner changes
  useEffect(() => {
    if (selectedPartner && partnerPlans[selectedPartner]?.length > 0) {
      setSelectedPlan(partnerPlans[selectedPartner][0].id);
    } else {
      setSelectedPlan("");
    }
  }, [selectedPartner, partnerPlans]);

  // Filter available plans for selected partner
  const availablePlans = selectedPartner ? partnerPlans[selectedPartner] || [] : [];

  const handleCalculate = async () => {
    if (!arrivalDate || !selectedPlan || !selectedCategory) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      // First check if there are base rates for the requested dates
      const startDate = format(arrivalDate, 'yyyy-MM-dd');
      const endDate = format(
        addDays(arrivalDate, nights - 1),
        'yyyy-MM-dd'
      );
      
      const { data: baseRatesData, error: baseRatesError } = await supabase
        .from('daily_base_rates')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (baseRatesError) throw baseRatesError;

      // Get the reference category ID and plan ID
      const referenceCategoryId = "classic-double"; // Remplacer par la valeur de référence correcte
      const referencePlanId = "ota-ro-flex"; // Remplacer par la valeur de référence correcte
      
      // Generate daily rates
      const nightlyRates = Array.from({ length: nights }).map((_, index) => {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + index);
        
        const dateString = format(date, 'yyyy-MM-dd');
        const baseRateForDay = baseRatesData?.find(rate => rate.date === dateString);
        
        let rate;
        
        if (baseRateForDay) {
          // Get the plan rule to determine base source
          const planRule = planRules.find(rule => rule.plan_id === selectedPlan);
          const baseSource = planRule?.base_source || "ota_rate";
          
          // Get base rate according to the source
          const baseRate = baseSource === "travco_rate" 
            ? baseRateForDay.travco_rate 
            : baseRateForDay.ota_rate;
          
          // Apply category rule
          const categoryRule = categoryRules.find(rule => rule.category_id === selectedCategory);
          const categoryRate = categoryRule 
            ? calculateCategoryRate(baseRate, selectedCategory, referenceCategoryId, [categoryRule])
            : baseRate;
          
          // Apply plan rule
          rate = planRule 
            ? calculatePlanRate(categoryRate, selectedPlan, referencePlanId, [planRule])
            : categoryRate;
        } else {
          // Weekend rates are higher if no data available
          const isWeekend = [0, 6].includes(date.getDay());
          const baseRate = isWeekend ? 140 : 120;
          
          // Apply simple modifiers if rules are available
          const categoryRule = categoryRules.find(rule => rule.category_id === selectedCategory);
          const planRule = planRules.find(rule => rule.plan_id === selectedPlan);
          
          let modifiedRate = baseRate;
          
          if (categoryRule) {
            modifiedRate = calculateCategoryRate(modifiedRate, selectedCategory, referenceCategoryId, [categoryRule]);
          }
          
          if (planRule) {
            modifiedRate = calculatePlanRate(modifiedRate, selectedPlan, referencePlanId, [planRule]);
          }
          
          rate = Math.round(modifiedRate);
        }
        
        return {
          date,
          rate,
        };
      });

      const totalRate = nightlyRates.reduce((sum, night) => sum + night.rate, 0);
      const averageRate = Math.round(totalRate / nights);
      const discountAmount = Math.round((totalRate * discount) / 100);
      const totalAfterDiscount = totalRate - discountAmount;

      setCalculationResult({
        nightlyRates,
        totalRate,
        averageRate,
        discount: discountAmount,
        totalAfterDiscount,
      });
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      toast.error("Impossible de calculer les tarifs");
    }
  };

  return {
    arrivalDate,
    setArrivalDate,
    isCalendarOpen,
    setIsCalendarOpen,
    nights,
    setNights,
    selectedPartner,
    setSelectedPartner,
    selectedPlan,
    setSelectedPlan,
    selectedCategory,
    setSelectedCategory,
    discount,
    setDiscount,
    calculationResult,
    categories,
    partners,
    plans,
    availablePlans,
    isLoading,
    handleCalculate
  };
}
