
import React from "react";
import { Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ComparisonFormProps } from "./types";

const comparisonModes = ["line", "bar", "table", "both"];
const comparisonModeLabels = {
  line: "Ligne",
  bar: "Barres",
  table: "Tableau",
  both: "Les deux"
};

export function ComparisonForm({
  dateRange,
  setDateRange,
  selectedPartners,
  setSelectedPartners,
  comparisonMode,
  setComparisonMode,
  onCompare,
  isLoading,
  allPartners,
  allPlans
}: ComparisonFormProps) {
  
  const addPartner = () => {
    if (selectedPartners.length < 3) {
      setSelectedPartners([...selectedPartners, {
        partnerId: "",
        partnerName: "",
        planId: "",
        planName: ""
      }]);
    } else {
      toast.warning("Vous ne pouvez comparer que 3 partenaires maximum");
    }
  };
  
  const removePartner = (index: number) => {
    if (selectedPartners.length > 1) {
      const newPartners = [...selectedPartners];
      newPartners.splice(index, 1);
      setSelectedPartners(newPartners);
    }
  };
  
  const updatePartner = (index: number, field: keyof (typeof selectedPartners)[0], value: string) => {
    const newPartners = [...selectedPartners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    
    // If it's the partner ID that changes, update the name too
    if (field === 'partnerId') {
      const partner = allPartners.find(p => p.id === value);
      if (partner) {
        newPartners[index].partnerName = partner.name;
      }
    }
    
    // If it's the plan ID that changes, update the plan name too
    if (field === 'planId') {
      const plan = allPlans.find(p => p.id === value);
      if (plan) {
        newPartners[index].planName = plan.description;
      }
    }
    
    setSelectedPartners(newPartners);
  };
  
  const getPlansForPartner = (partnerId: string) => {
    if (!partnerId) return [];
    return allPlans.filter(() => {
      // Simplified logic for plan association
      return true; // Return all plans for now
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de comparaison</CardTitle>
        <CardDescription>
          Sélectionnez une période et des partenaires à comparer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date range selection */}
          <div className="space-y-2">
            <label className="font-medium">Période</label>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full"
            />
          </div>
          
          {/* Partner selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-medium">Partenaires et plans</label>
              {selectedPartners.length < 3 && (
                <Button 
                  onClick={addPartner} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Ajouter un partenaire
                </Button>
              )}
            </div>
            
            {selectedPartners.map((partner, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border p-3 rounded-md bg-card/50">
                <div className="md:col-span-5">
                  <label className="text-sm mb-1 block">Partenaire {index + 1}</label>
                  <select
                    value={partner.partnerId}
                    onChange={(e) => updatePartner(index, 'partnerId', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Sélectionner un partenaire</option>
                    {allPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-5">
                  <label className="text-sm mb-1 block">Plan tarifaire</label>
                  <select
                    value={partner.planId}
                    onChange={(e) => updatePartner(index, 'planId', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    disabled={!partner.partnerId}
                  >
                    <option value="">Sélectionner un plan</option>
                    {getPlansForPartner(partner.partnerId).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                {index > 0 && (
                  <div className="md:col-span-2 flex justify-end">
                    <Button 
                      onClick={() => removePartner(index)} 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Visualization mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <label className="font-medium">Mode de visualisation</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {comparisonModeLabels[comparisonMode as keyof typeof comparisonModeLabels]}
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuRadioGroup value={comparisonMode} onValueChange={setComparisonMode}>
                    {comparisonModes.map((mode) => (
                      <DropdownMenuRadioItem key={mode} value={mode}>
                        {comparisonModeLabels[mode as keyof typeof comparisonModeLabels]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-end">
              <Button onClick={onCompare} disabled={isLoading}>
                {isLoading ? "Chargement..." : "Comparer"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
