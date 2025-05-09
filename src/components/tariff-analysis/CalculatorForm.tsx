
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Partner, Plan, Category } from '@/services/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalculatorFormProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedPartner: string;
  setSelectedPartner: (partner: string) => void;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  calculateRate: () => void;
  partners: Partner[];
  categories: Category[];
  plans: Plan[];
  getPlansForPartner: (partnerId: string) => Plan[];
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({
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
  calculateRate,
  partners,
  categories,
  plans,
  getPlansForPartner
}) => {
  return (
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
  );
};

export default CalculatorForm;
