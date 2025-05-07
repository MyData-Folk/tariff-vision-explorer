
import { addDays, format, subDays } from "date-fns";

// Helper to generate a range of dates
export const generateDateRange = (startDate: Date, days: number) => {
  return Array.from({ length: days }).map((_, i) => 
    addDays(startDate, i)
  );
};

// Generate random tariff between range
export const randomTariff = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Mock categories
export const mockCategories = [
  { id: '1', name: 'Deluxe' },
  { id: '2', name: 'Suite' },
  { id: '3', name: 'Standard' },
  { id: '4', name: 'Premium' },
];

// Mock partners
export const mockPartners = [
  { id: '1', name: 'Booking' },
  { id: '2', name: 'Expedia' },
  { id: '3', name: 'Travco' },
  { id: '4', name: 'Direct' },
];

// Mock rate plans
export const mockRatePlans = [
  { id: '1', name: 'Standard', partnerId: '1' },
  { id: '2', name: 'Flexible', partnerId: '1' },
  { id: '3', name: 'Non-Remboursable', partnerId: '1' },
  { id: '4', name: 'Standard', partnerId: '2' },
  { id: '5', name: 'Flexible', partnerId: '2' },
  { id: '6', name: 'Standard', partnerId: '3' },
  { id: '7', name: 'Direct', partnerId: '4' },
];

// Generate base rates for last 30 days and next 30 days
export const generateMockBaseRates = () => {
  const today = new Date();
  const startDate = subDays(today, 30);
  const dates = generateDateRange(startDate, 60);
  
  const baseRates = [];
  
  for (const date of dates) {
    for (const category of mockCategories) {
      // Weekend rates slightly higher
      const isWeekend = [0, 6].includes(date.getDay());
      const baseValue = category.name === 'Deluxe' ? 120 : 
                      category.name === 'Suite' ? 180 :
                      category.name === 'Standard' ? 100 : 150;
      
      // Add some variability based on day of week and random factor
      const rate = baseValue * (isWeekend ? 1.25 : 1) * (0.85 + Math.random() * 0.3);
      
      baseRates.push({
        id: `${date.getTime()}-${category.id}`,
        date: date,
        categoryId: category.id,
        value: Math.round(rate),
        source: Math.random() > 0.5 ? 'OTA' : 'Travco'
      });
    }
  }
  
  return baseRates;
};

// Generate calculated rates based on base rates and rate plans
export const generateMockCalculatedRates = (baseRates: any[]) => {
  const calculatedRates: any[] = [];
  
  baseRates.forEach(baseRate => {
    mockRatePlans.forEach(plan => {
      let adjustmentFactor = 1;
      
      // Different adjustment factors based on plan type
      if (plan.name === 'Flexible') {
        adjustmentFactor = 1.15;
      } else if (plan.name === 'Non-Remboursable') {
        adjustmentFactor = 0.9;
      } else if (plan.name === 'Direct') {
        adjustmentFactor = 0.95;
      }
      
      calculatedRates.push({
        id: `${baseRate.id}-${plan.id}`,
        baseRateId: baseRate.id,
        rateDate: baseRate.date,
        rateValue: Math.round(baseRate.value * adjustmentFactor),
        categoryId: baseRate.categoryId,
        planId: plan.id
      });
    });
  });
  
  return calculatedRates;
};

// Generate recent activities
export const generateMockActivities = () => {
  const today = new Date();
  
  return [
    {
      id: '1',
      action: 'Calcul de tarifs',
      target: 'Booking - Standard - Deluxe',
      date: subDays(today, 0),
      user: 'Sophie Martin'
    },
    {
      id: '2',
      action: 'Comparaison de tarifs',
      target: 'Expedia vs Booking',
      date: subDays(today, 1),
      user: 'Thomas Dupont'
    },
    {
      id: '3',
      action: 'Mise à jour des tarifs de base',
      target: 'Juillet 2025',
      date: subDays(today, 2),
      user: 'Marine Leblanc'
    },
    {
      id: '4',
      action: 'Analyse de rentabilité',
      target: 'Q2 2025',
      date: subDays(today, 3),
      user: 'Jean Moreau'
    }
  ];
};
