import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Pills from "./Pills";

export type Structure = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  parent_id: number | null;
  prefix: string;
  children?: Structure[];
};

interface MultiLevelProps {
  options: Structure[];
  onSelectionChange: (selectedOptions: Structure[]) => void;
  selectedOptions?: Structure[];
  placeholder?: string;
}

/**
 * MultiLevel component for selecting multiple hierarchical structures.
 */
export default function MultiFloor({
  options,
  onSelectionChange,
  selectedOptions: preSelectedOptions = [],
  placeholder = "Select Structure",
}: MultiLevelProps) {
  const [selectedOptions, setSelectedOptions] =
    useState<Structure[]>(preSelectedOptions);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedOptions(preSelectedOptions);
  }, [preSelectedOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle toggling of an option
  const handleToggleOption = (option: Structure) => {
    let updated: Structure[];
    const alreadySelected = selectedOptions.some((o) => o.id === option.id);

    if (alreadySelected) {
      updated = selectedOptions.filter((o) => o.id !== option.id);
    } else {
      updated = [...selectedOptions, option];
    }
    setSelectedOptions(updated);
    onSelectionChange(updated);
  };

  // Filter top-level options by searchTerm
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Recursively render option and its children
  const renderOption = (option: Structure, level = 0): ReactNode => {
    // Filter out items if they don't match the search
    if (
      searchTerm &&
      !option.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return null;
    }

    const isSelected = selectedOptions.some((sel) => sel.id === option.id);

    return (
      <li key={option.id}>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2 rounded-md cursor-pointer",
            "transition-colors duration-150",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:bg-accent focus:text-accent-foreground focus:outline-none",
            isSelected && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: 12 + level * 16 }}
          onClick={() => handleToggleOption(option)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggleOption(option);
            }
          }}
        >
          <div className="min-w-0">
            <div className="truncate">
              {option.name}
              {option.description ? ` - ${option.description}` : ""}
            </div>
          </div>
          {isSelected && <Check className="h-4 w-4 shrink-0" />}
        </div>

        {option.children && option.children.length > 0 && (
          <ul className="mt-0.5">
            {option.children.map((child) => renderOption(child, level + 1))}
          </ul>
        )}
      </li>
    );
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
        {selectedOptions.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
            {selectedOptions.map((option) => (
              <Pills
                key={option.id}
                text={`${option.name} (${option.prefix})`}
                onClick={() => {
                  const updated = selectedOptions.filter(
                    (o) => o.id !== option.id
                  );
                  setSelectedOptions(updated);
                  onSelectionChange(updated);
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 w-full">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isDropdownOpen) setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsDropdownOpen(false);
                setSearchTerm("");
              } else if (e.key === "Enter" && filteredOptions.length > 0) {
                e.preventDefault();
                handleToggleOption(filteredOptions[0]);
              }
            }}
            placeholder={
              selectedOptions.length === 0 ? placeholder : "Search structure..."
            }
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
          {filteredOptions.length > 0 ? (
            <ul className="overflow-y-auto max-h-[250px] p-1">
              {filteredOptions.map((option) => renderOption(option))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-muted-foreground">
              No matching structures found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
