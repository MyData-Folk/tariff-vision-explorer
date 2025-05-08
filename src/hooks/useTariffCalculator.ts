
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category, Partner, Plan } from "@/services/types";
import { format } from "date-fns";

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
        
        setCategories(categoriesData || []);
        setPartners(partnersData || []);
        setPlans(plansData || []);
        
        // Set default values if available
        if (partnersData && partnersData.length > 0) {
          setSelectedPartner(partnersData[0].id);
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

  // Filter available plans for selected partner
  const availablePlans = plans.filter(plan => {
    // Logic to filter plans by partner
    // To be adapted based on your data structure
    return true; // For now, show all plans
  });

  const handleCalculate = async () => {
    if (!arrivalDate || !selectedPlan || !selectedCategory) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      // First check if there are base rates for the requested dates
      const startDate = format(arrivalDate, 'yyyy-MM-dd');
      const endDate = format(
        new Date(arrivalDate.getTime() + (nights - 1) * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      
      const { data: baseRatesData, error: baseRatesError } = await supabase
        .from('daily_base_rates')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (baseRatesError) throw baseRatesError;
      
      // Generate daily rates
      const baseRate = getBaseRateForCategory(selectedCategory);
      const nightlyRates = Array.from({ length: nights }).map((_, index) => {
        const date = new Date(arrivalDate);
        date.setDate(date.getDate() + index);
        
        const dateString = format(date, 'yyyy-MM-dd');
        const baseRateForDay = baseRatesData?.find(rate => rate.date === dateString);
        
        // Weekend rates are higher
        const isWeekend = [0, 6].includes(date.getDay());
        const adjustmentFactor = isWeekend ? 1.2 : 1;
        
        // Use the base rate from database if available, otherwise use the formula
        let rate;
        if (baseRateForDay) {
          rate = baseRateForDay.ota_rate; // or another field depending on your structure
        } else {
          // Randomness factor to simulate variations if no data available
          const randomFactor = 0.9 + Math.random() * 0.2;
          rate = Math.round(baseRate * adjustmentFactor * randomFactor);
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
  
  // Function to get base rate by category
  const getBaseRateForCategory = (categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    // Simplified logic - in a real case, you would retrieve this value from the database or a complex calculation
    switch (category?.name.toLowerCase()) {
      case 'deluxe': return 145;
      case 'suite': return 210;
      case 'standard': return 115;
      case 'premium': return 175;
      default: return 120;
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
