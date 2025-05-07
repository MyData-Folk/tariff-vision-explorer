
import { DailyRate, Partner, Plan } from "@/services/types";
import { DateRange } from "react-day-picker";

export interface SelectedPartner {
  partnerId: string;
  partnerName: string;
  planId: string;
  planName: string;
}

export interface ChartData {
  date: string;
  [key: string]: string | number;
}

export interface DifferenceData {
  plan: string;
  baselinePlan: string;
  averageDifference: number;
  percentDifference: string; // Changé de number à string pour correspondre à l'utilisation
  isAbove: boolean;
}

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

export interface ChartVisualizationProps {
  chartData: ChartData[];
  comparisonMode: string;
  selectedPartners: SelectedPartner[];
  dateRange: DateRange;
}

export interface DifferenceAnalysisProps {
  differencesData: DifferenceData[];
  chartData: ChartData[];
  selectedPartners: SelectedPartner[];
}

export interface DataTableProps {
  chartData: ChartData[];
  selectedPartners: SelectedPartner[];
}
