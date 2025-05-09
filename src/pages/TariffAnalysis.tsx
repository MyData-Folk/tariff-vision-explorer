
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CalculatorForm from '@/components/tariff-analysis/CalculatorForm';
import CalculationResult from '@/components/tariff-analysis/CalculationResult';
import RulesInfo from '@/components/tariff-analysis/RulesInfo';
import { useTariffAnalysis } from '@/hooks/useTariffAnalysis';

const TariffAnalysis = () => {
  const {
    partners,
    plans,
    categories,
    categoryRules,
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
  } = useTariffAnalysis();

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
              <CalculatorForm
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedPartner={selectedPartner}
                setSelectedPartner={setSelectedPartner}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                discount={discount}
                setDiscount={setDiscount}
                calculateRate={calculateRate}
                partners={partners}
                categories={categories}
                plans={plans}
                getPlansForPartner={getPlansForPartner}
              />
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
              <CalculationResult 
                steps={calculationResult.steps}
                finalRate={calculationResult.finalRate}
              />
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
            {!loading && (
              <RulesInfo
                categoryRules={categoryRules}
                partners={partners}
                plans={plans}
                getPlansForPartner={getPlansForPartner}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TariffAnalysis;
