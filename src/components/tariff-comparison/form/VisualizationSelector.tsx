
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VisualizationSelectorProps {
  comparisonMode: string;
  setComparisonMode: (mode: string) => void;
  onCompare: () => void;
  isLoading: boolean;
}

const comparisonModes = ["line", "bar", "table", "both"];
const comparisonModeLabels = {
  line: "Ligne",
  bar: "Barres",
  table: "Tableau",
  both: "Les deux"
};

export function VisualizationSelector({
  comparisonMode,
  setComparisonMode,
  onCompare,
  isLoading
}: VisualizationSelectorProps) {
  return (
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
  );
}
