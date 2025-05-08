
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, Partner, Plan } from "@/services/types";

interface TariffCalculatorFormProps {
  arrivalDate: Date | undefined;
  setArrivalDate: (date: Date | undefined) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (isOpen: boolean) => void;
  nights: number;
  setNights: (nights: number) => void;
  selectedPartner: string;
  setSelectedPartner: (partnerId: string) => void;
  selectedPlan: string;
  setSelectedPlan: (planId: string) => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  handleCalculate: () => void;
  categories: Category[];
  partners: Partner[];
  availablePlans: Plan[];
  isLoading: boolean;
}

const TariffCalculatorForm: React.FC<TariffCalculatorFormProps> = ({
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
  handleCalculate,
  categories,
  partners,
  availablePlans,
  isLoading,
}) => {
  return (
    <Card className="lg:col-span-1 glass-effect">
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
        <CardDescription>
          Définissez les paramètres pour calculer le tarif
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="arrival-date">Date d'arrivée</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !arrivalDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {arrivalDate ? (
                  format(arrivalDate, "PPP", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={arrivalDate}
                onSelect={(date) => {
                  setArrivalDate(date);
                  setIsCalendarOpen(false); // Fermer le calendrier après sélection
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nights">Nombre de nuits</Label>
          <Input
            id="nights"
            type="number"
            value={nights}
            min={1}
            onChange={(e) => setNights(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="partner">Partenaire</Label>
          <Select
            value={selectedPartner}
            onValueChange={(value) => {
              setSelectedPartner(value);
              setSelectedPlan("");
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un partenaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Partenaires</SelectLabel>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan tarifaire</Label>
          <Select
            value={selectedPlan}
            onValueChange={setSelectedPlan}
            disabled={!selectedPartner || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Plans disponibles</SelectLabel>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.code}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie de chambre</Label>
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Catégories</SelectLabel>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount">Remise (%)</Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            min={0}
            max={100}
            onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full btn-3d" 
          onClick={handleCalculate}
          disabled={!arrivalDate || !selectedPlan || !selectedCategory || isLoading}
        >
          Calculer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TariffCalculatorForm;
