import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Stage = {
  id: string;
  label: string;
};

interface MultiStageProps {
  stages: Stage[];
  selectedStages: string[];
  onSelectionChange: (selectedStages: string[]) => void;
  placeholder?: string;
}

export default function MultiStage({
  stages,
  selectedStages,
  onSelectionChange,
  placeholder = "Select stages...",
}: MultiStageProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter stages based on search query and exclude selected ones
  const availableStages = useMemo(() => {
    return stages.filter(
      (stage) =>
        !selectedStages.includes(stage.id) &&
        stage.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stages, selectedStages, searchQuery]);

  const handleFocusInput = () => {
    setIsDropdownOpen(true);
  };

  const handleSelectStage = (stage: Stage) => {
    if (!selectedStages.includes(stage.id)) {
      const updatedSelected = [...selectedStages, stage.id];
      onSelectionChange(updatedSelected);
      setSearchQuery("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveStage = (stageId: string) => {
    const updatedSelected = selectedStages.filter((id) => id !== stageId);
    onSelectionChange(updatedSelected);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setSearchQuery("");
    } else if (e.key === "Enter" && availableStages.length > 0) {
      e.preventDefault();
      handleSelectStage(availableStages[0]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Area */}
      <div
        className={cn(
          "flex flex-col gap-2 p-2 min-h-[42px]",
          "border rounded-lg bg-background",
          "transition-colors duration-200",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isDropdownOpen
            ? "border-primary ring-2 ring-ring ring-offset-2"
            : "border-input hover:border-primary/50"
        )}
        onClick={() => {
          inputRef.current?.focus();
          setIsDropdownOpen(true);
        }}
      >
        {selectedStages.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
            {selectedStages.map((stageId) => {
              const stage = stages.find((s) => s.id === stageId);
              return (
                stage && (
                  <span
                    key={`pill-${stageId}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium",
                      "bg-primary/10 text-primary border border-primary/20",
                      "transition-all duration-200 hover:bg-primary/15 pr-1"
                    )}
                  >
                    <span className="truncate max-w-[200px]">
                      {stage.label}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        "ml-0.5 rounded-full p-0.5 transition-colors",
                        "hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "flex items-center justify-center"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStage(stageId);
                      }}
                      aria-label={`Remove ${stage.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 w-full">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={
              selectedStages.length === 0 ? placeholder : "Search stages..."
            }
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocusInput}
            onKeyDown={handleInputKeyDown}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
          />
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
              isDropdownOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg max-h-[250px] overflow-hidden animate-in fade-in-0 zoom-in-95">
          {availableStages.length > 0 ? (
            <ul className="overflow-y-auto max-h-[250px] p-1">
              {availableStages.map((stage) => (
                <li
                  key={stage.id}
                  className={cn(
                    "px-3 py-2 rounded-md cursor-pointer",
                    "text-sm transition-colors duration-150",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  )}
                  onClick={() => handleSelectStage(stage)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectStage(stage);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="font-medium">{stage.label}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">
              {searchQuery
                ? "No stages found matching your search"
                : "No stages available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
