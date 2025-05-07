
import { DateRange } from "react-day-picker";
import { Partner, Plan } from "@/services/types";
import { SelectedPartner } from "@/components/tariff-comparison/types";

export interface ComparisonFormProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedPartners: SelectedPartner[];
  setSelectedPartners: (partners: SelectedPartner[]) => void;
  comparisonMode: string;
  setComparisonMode: (mode: string) => void;
  onCompare: () => void;
  isLoading: boolean;
  allPartners: Partner[];
  allPlans: Plan[];
}
