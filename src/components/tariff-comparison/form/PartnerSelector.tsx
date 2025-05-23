
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Search, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Partner, Plan } from "@/services/types";
import { SelectedPartner } from "../types";
import { Input } from "@/components/ui/input";

interface PartnerSelectorProps {
  selectedPartners: SelectedPartner[];
  setSelectedPartners: (partners: SelectedPartner[]) => void;
  allPartners: Partner[];
  partnerPlans: { [key: string]: Plan[] };
}

export function PartnerSelector({
  selectedPartners,
  setSelectedPartners,
  allPartners,
  partnerPlans,
}: PartnerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>(allPartners);

  // Filter partners based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPartners(allPartners);
      return;
    }
    
    const filtered = allPartners.filter(partner => 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPartners(filtered);
  }, [searchTerm, allPartners]);

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
  
  const updatePartner = (index: number, field: keyof SelectedPartner, value: string) => {
    const newPartners = [...selectedPartners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    
    // If it's the partner ID that changes, update the name too
    if (field === 'partnerId') {
      const partner = allPartners.find(p => p.id === value);
      if (partner) {
        newPartners[index].partnerName = partner.name;
        // Reset the plan if the partner changes
        newPartners[index].planId = "";
        newPartners[index].planName = "";
      }
    }
    
    // If it's the plan ID that changes, update the plan name too
    if (field === 'planId') {
      const plans = partnerPlans[newPartners[index].partnerId] || [];
      const plan = plans.find(p => p.id === value);
      if (plan) {
        newPartners[index].planName = plan.code;
      }
    }
    
    setSelectedPartners(newPartners);
  };
  
  // Get plans for a specific partner
  const getPlansForPartner = (partnerId: string) => {
    if (!partnerId) return [];
    return partnerPlans[partnerId] || [];
  };

  // When a partner is selected and has plans, automatically select the first plan if none is selected
  useEffect(() => {
    const newPartners = [...selectedPartners];
    let hasChanged = false;
    
    newPartners.forEach((partner, index) => {
      if (partner.partnerId && !partner.planId) {
        const availablePlans = getPlansForPartner(partner.partnerId);
        if (availablePlans.length > 0) {
          partner.planId = availablePlans[0].id;
          partner.planName = availablePlans[0].code;
          hasChanged = true;
        }
      }
    });
    
    if (hasChanged) {
      setSelectedPartners(newPartners);
    }
  }, [selectedPartners, partnerPlans]);

  // Function to clear search and reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilteredPartners(allPartners);
    toast.info("Filtres réinitialisés");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="font-medium">Partenaires et plans</label>
          <Button 
            onClick={resetFilters}
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            title="Réinitialiser les filtres"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 w-full md:w-[180px]"
            />
          </div>
          {selectedPartners.length < 3 && (
            <Button 
              onClick={addPartner} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 h-9"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          )}
        </div>
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
              {filteredPartners.map((p) => (
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
                  {p.code}
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
  );
}
