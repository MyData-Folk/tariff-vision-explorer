
import React from 'react';

interface CalculationStep {
  description: string;
  value: number;
}

interface CalculationResultProps {
  steps: CalculationStep[];
  finalRate: number;
}

const CalculationResult: React.FC<CalculationResultProps> = ({ steps, finalRate }) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <h3 className="font-medium mb-2">Étapes de calcul</h3>
        <ul className="space-y-2">
          {steps.map((step, index) => (
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
          <span className="text-2xl font-bold">{finalRate.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
};

export default CalculationResult;
