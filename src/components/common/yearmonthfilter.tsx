import { useState, useEffect } from "react";
import { format, getYear, getMonth } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type DateFilterProps = {
  onChange: (
    filter:
      | { type: "yearly"; year: number }
      | { type: "monthly"; year: number; month: number }
      | { type: "custom"; start_date: string; end_date: string }
  ) => void;
  startDate?: Date; // earliest selectable date
};

type FilterType = "yearly" | "monthly" | "custom";

export function YearMonthFilter({ onChange, startDate }: DateFilterProps) {
  const today = new Date();
  const minDate = startDate || new Date(2023, 0, 1);
  const minYear = getYear(minDate);
  const maxYear = getYear(today);

  const [filterType, setFilterType] = useState<FilterType>("yearly");
  const [selectedYear, setSelectedYear] = useState<number>(getYear(today));
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(today));
  const [customStart, setCustomStart] = useState<string>(
    format(today, "yyyy-MM-dd")
  );
  const [customEnd, setCustomEnd] = useState<string>(
    format(today, "yyyy-MM-dd")
  );

  // Generate year options
  const getYearOptions = () => {
    const years = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);
    return years;
  };

  // Generate month options for selected year
  const getMonthOptions = () => {
    const months = [];
    const startM = selectedYear === minYear ? getMonth(minDate) : 0;
    const endM = selectedYear === maxYear ? getMonth(today) : 11;
    for (let m = endM; m >= startM; m--) months.push(m);
    return months;
  };

  // Handle yearly filter
  const handleYearlyFilter = (year: number) => {
    setSelectedYear(year);
    onChange({ type: "yearly", year });
  };

  // Handle monthly filter
  const handleMonthlyFilter = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    onChange({ type: "monthly", year, month: month + 1 });
  };

  useEffect(() => {
    if (filterType === "yearly") {
      handleYearlyFilter(selectedYear);
    } else if (filterType === "monthly") {
      handleMonthlyFilter(selectedYear, selectedMonth);
    } else if (filterType === "custom") {
      // emit only if dates are valid and in order
      if (customStart && customEnd && customEnd >= customStart) {
        onChange({
          type: "custom",
          start_date: customStart,
          end_date: customEnd,
        });
      }
    }
    // eslint-disable-next-line
  }, [filterType, selectedYear, selectedMonth, customStart, customEnd]);

  const renderSummary = () => {
    if (filterType === "yearly") return `Year: ${selectedYear}`;
    if (filterType === "monthly")
      return `Month: ${format(
        new Date(selectedYear, selectedMonth, 1),
        "MMM yyyy"
      )}`;
    return customStart && customEnd
      ? `Custom: ${format(new Date(customStart), "dd MMM yyyy")} → ${format(
          new Date(customEnd),
          "dd MMM yyyy"
        )}`
      : "Custom: Select dates";
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border bg-card p-3">
      <RadioGroup
        value={filterType}
        onValueChange={(value) => {
          setFilterType(value as FilterType);
        }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yearly" id="yearly" className="h-4 w-4" />
          <Label htmlFor="yearly" className="text-sm">
            Yearly
          </Label>
        </div>
        {/* <div className="flex items-center space-x-1">
          <RadioGroupItem value="weekly" id="weekly" className="h-4 w-4" />
          <Label htmlFor="weekly" className="text-sm">
            Date
          </Label>
        </div> */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="monthly" id="monthly" className="h-4 w-4" />
          <Label htmlFor="monthly" className="text-sm">
            Monthly
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="custom" className="h-4 w-4" />
          <Label htmlFor="custom" className="text-sm">
            Custom
          </Label>
        </div>
      </RadioGroup>

      {filterType === "yearly" && (
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Year
            </Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                setSelectedMonth(getMonth(today));
                onChange({ type: "yearly", year: Number(value) });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-sm"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* {filterType === "weekly" && (
        <>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => {
              setSelectedYear(Number(value));
              setSelectedMonth(getMonth(today));
              setSelectedDay(null);
              setSelectedDate(null);
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((year) => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                  className="text-sm"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => {
              setSelectedMonth(Number(value));
              setSelectedDay(null);
              setSelectedDate(null);
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map((month) => (
                <SelectItem
                  key={month}
                  value={month.toString()}
                  className="text-sm"
                >
                  {format(new Date(selectedYear, month, 1), "MMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedDay?.toString() || ""}
            onValueChange={(value) => {
              handleWeeklyFilter(Number(value));
            }}
          >
            <SelectTrigger className="w-[90px] h-8 text-sm">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {getDayOptions().map((day) => (
                <SelectItem
                  key={day}
                  value={day.toString()}
                  className="text-sm"
                >
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )} */}

      {filterType === "monthly" && (
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Year
            </Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                setSelectedMonth(getMonth(today));
                onChange({ type: "yearly", year: Number(value) });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-sm"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Month
            </Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => {
                setSelectedMonth(Number(value));
                handleMonthlyFilter(selectedYear, Number(value));
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem
                    key={month}
                    value={month.toString()}
                    className="text-sm"
                  >
                    {format(new Date(selectedYear, month, 1), "MMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filterType === "custom" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <Label className="mb-1 block text-xs text-muted-foreground">
                Start date
              </Label>
              <Input
                type="date"
                className="h-8 px-2 text-sm"
                value={customStart}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomStart(val);
                  // Ensure end is not before start
                  if (customEnd < val) {
                    setCustomEnd(val);
                  }
                }}
                min={format(minDate, "yyyy-MM-dd")}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="mb-1 block text-xs text-muted-foreground">
                End date
              </Label>
              <Input
                type="date"
                className="h-8 px-2 text-sm"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart || format(minDate, "yyyy-MM-dd")}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            End date must be on or after the start date.
          </p>
        </div>
      )}

      <div className="mt-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {renderSummary()}
        </span>
      </div>
    </div>
  );
}
