
import React from "react";
import TariffCalculatorForm from "@/components/tariff-calculator/TariffCalculatorForm";
import TariffCalculatorResults from "@/components/tariff-calculator/TariffCalculatorResults";
import { useTariffCalculator } from "@/hooks/useTariffCalculator";

const TariffCalculator = () => {
  const {
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
    availablePlans,
    isLoading,
    handleCalculate
  } = useTariffCalculator();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Calcul des tarifs</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TariffCalculatorForm
          arrivalDate={arrivalDate}
          setArrivalDate={setArrivalDate}
          isCalendarOpen={isCalendarOpen}
          setIsCalendarOpen={setIsCalendarOpen}
          nights={nights}
          setNights={setNights}
          selectedPartner={selectedPartner}
          setSelectedPartner={setSelectedPartner}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          discount={discount}
          setDiscount={setDiscount}
          handleCalculate={handleCalculate}
          categories={categories}
          partners={partners}
          availablePlans={availablePlans}
          isLoading={isLoading}
        />
        
        <TariffCalculatorResults 
          calculationResult={calculationResult}
          discount={discount}
        />
      </div>
    </div>
  );
};

export default TariffCalculator;
