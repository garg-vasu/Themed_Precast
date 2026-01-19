import { useState, useEffect, useMemo } from "react";
import { format, endOfMonth, getYear, getMonth } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type DateFilterProps = {
  onChange: (filter: {
    type: "yearly" | "monthly" | "weekly";
    year: number;
    month?: number;
    week?: number;
    date?: Date;
  }) => void;
  startDate?: Date; // earliest selectable date
};

type FilterType = "yearly" | "weekly" | "monthly";

export function DateFilter({ onChange, startDate }: DateFilterProps) {
  const today = new Date();
  const minDate = startDate || new Date(2023, 0, 1);
  const minYear = getYear(minDate);
  const maxYear = getYear(today);

  const [filterType, setFilterType] = useState<FilterType>("yearly");
  const [selectedYear, setSelectedYear] = useState<number>(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(today));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Memoize options to avoid recalculation
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);
    return years;
  }, [minYear, maxYear]);

  const monthOptions = useMemo(() => {
    const months = [];
    const startM = selectedYear === minYear ? getMonth(minDate) : 0;
    const endM = selectedYear === maxYear ? getMonth(today) : 11;
    for (let m = endM; m >= startM; m--) months.push(m);
    return months;
  }, [selectedYear, minYear, maxYear, minDate, today]);

  const dayOptions = useMemo(() => {
    const days = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = endOfMonth(firstDay).getDate();
    const minDay =
      selectedYear === minYear && selectedMonth === getMonth(minDate)
        ? minDate.getDate()
        : 1;
    const maxDay =
      selectedYear === maxYear && selectedMonth === getMonth(today)
        ? today.getDate()
        : lastDay;
    for (let d = minDay; d <= maxDay; d++) days.push(d);
    return days;
  }, [selectedYear, selectedMonth, minYear, maxYear, minDate, today]);

  // Handle yearly filter
  const handleYearlyFilter = (year: number) => {
    setSelectedYear(year);
    onChange({ type: "yearly", year });
  };

  // Handle weekly filter (now date selection)
  const handleWeeklyFilter = (day: number) => {
    setSelectedDay(day);
    const date = new Date(selectedYear, selectedMonth, day);
    onChange({
      type: "weekly",
      year: selectedYear,
      month: selectedMonth + 1,
      date,
    } as any);
  };

  // Handle monthly filter
  const handleMonthlyFilter = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    onChange({ type: "monthly", year, month: month + 1 });
  };

  // Reset date-related state
  const resetDateState = () => {
    setSelectedDay(null);
  };

  // Handle filter type change
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as FilterType);
    if (value === "weekly") {
      resetDateState();
    }
  };

  // Handle year change
  const handleYearChange = (year: number, shouldTriggerOnChange = false) => {
    setSelectedYear(year);
    setSelectedMonth(getMonth(today));
    resetDateState();
    if (shouldTriggerOnChange && filterType === "yearly") {
      onChange({ type: "yearly", year });
    }
  };

  // Handle month change
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    resetDateState();
  };

  useEffect(() => {
    if (filterType === "yearly") {
      handleYearlyFilter(selectedYear);
    } else if (filterType === "weekly" && selectedDay) {
      handleWeeklyFilter(selectedDay);
    } else if (filterType === "monthly") {
      handleMonthlyFilter(selectedYear, selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedYear, selectedMonth, selectedDay]);

  // Reusable Year Select Component
  const YearSelect = ({
    onYearChange,
  }: {
    onYearChange: (year: number) => void;
  }) => (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => onYearChange(Number(value))}
    >
      <SelectTrigger className="w-[85px] sm:w-[100px] h-8 sm:h-9 text-xs sm:text-sm font-medium transition-colors px-2 py-1">
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent>
        {yearOptions.map((year) => (
          <SelectItem
            key={year}
            value={year.toString()}
            className="text-xs sm:text-sm cursor-pointer"
          >
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Reusable Month Select Component
  const MonthSelect = ({
    onMonthChange,
  }: {
    onMonthChange: (month: number) => void;
  }) => (
    <Select
      value={selectedMonth.toString()}
      onValueChange={(value) => onMonthChange(Number(value))}
    >
      <SelectTrigger className="w-[90px] sm:w-[110px] h-8 sm:h-9 text-xs sm:text-sm font-medium transition-colors px-2 py-1">
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((month) => (
          <SelectItem
            key={month}
            value={month.toString()}
            className="text-xs sm:text-sm cursor-pointer"
          >
            {format(new Date(selectedYear, month, 1), "MMM")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Reusable Day Select Component
  const DaySelect = ({
    onDayChange,
  }: {
    onDayChange: (day: number) => void;
  }) => (
    <Select
      value={selectedDay?.toString() || ""}
      onValueChange={(value) => onDayChange(Number(value))}
    >
      <SelectTrigger className="w-[75px] sm:w-[90px] h-8 sm:h-9 text-xs sm:text-sm font-medium transition-colors px-2 py-1">
        <SelectValue placeholder="Day" />
      </SelectTrigger>
      <SelectContent>
        {dayOptions.map((day) => (
          <SelectItem
            key={day}
            value={day.toString()}
            className="text-xs sm:text-sm cursor-pointer"
          >
            {day}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="inline-flex flex-wrap items-center gap-1 px-2 py-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
      <RadioGroup
        value={filterType}
        onValueChange={handleFilterTypeChange}
        className="flex items-center gap-1"
      >
        <div className="flex items-center space-x-1 group">
          <RadioGroupItem
            value="yearly"
            id="yearly"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 cursor-pointer transition-all"
          />
          <Label
            htmlFor="yearly"
            className="text-xs sm:text-sm font-medium cursor-pointer transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300"
          >
            Yearly
          </Label>
        </div>
        <div className="flex items-center space-x-1 group">
          <RadioGroupItem
            value="weekly"
            id="weekly"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 cursor-pointer transition-all"
          />
          <Label
            htmlFor="weekly"
            className="text-xs sm:text-sm font-medium cursor-pointer transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300"
          >
            Date
          </Label>
        </div>
        <div className="flex items-center space-x-1 group">
          <RadioGroupItem
            value="monthly"
            id="monthly"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 cursor-pointer transition-all"
          />
          <Label
            htmlFor="monthly"
            className="text-xs sm:text-sm font-medium cursor-pointer transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300"
          >
            Monthly
          </Label>
        </div>
      </RadioGroup>

      <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-1">
        {filterType === "yearly" && (
          <YearSelect onYearChange={(year) => handleYearChange(year, true)} />
        )}

        {filterType === "weekly" && (
          <>
            <YearSelect
              onYearChange={(year) => {
                handleYearChange(year);
                setSelectedMonth(getMonth(today));
              }}
            />
            <MonthSelect onMonthChange={handleMonthChange} />
            <DaySelect onDayChange={handleWeeklyFilter} />
          </>
        )}

        {filterType === "monthly" && (
          <>
            <YearSelect onYearChange={(year) => handleYearChange(year, true)} />
            <MonthSelect onMonthChange={handleMonthChange} />
          </>
        )}
      </div>
    </div>
  );
}
