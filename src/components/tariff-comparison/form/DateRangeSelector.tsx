
import React from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface DateRangeSelectorProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

export function DateRangeSelector({ dateRange, setDateRange }: DateRangeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="font-medium">Période</label>
      <DateRangePicker
        date={dateRange}
        onDateChange={setDateRange}
        className="w-full"
      />
    </div>
  );
}
