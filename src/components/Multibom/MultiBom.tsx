import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Pills from "./Pills";

export type Product = {
  bom_id: number;
  project_id?: number;
  bom_name: string;
  bom_type: string;
  created_at: string;
  updated_at: string;
  unit?: string;
  rate?: number;
  vendor?: string;
};

interface MultiSelectProps {
  users: Product[];
  selected: Product[]; // Controlled prop from parent
  onSelectionChange: (selectedUsers: Product[]) => void;
  placeholder?: string;
  lockedSelected?: number[];
}

export default function MultiBom({
  users,
  selected,
  onSelectionChange,
  placeholder = "Search for BOM",
  lockedSelected = [],
}: MultiSelectProps) {
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

  // Filter users based on search query and exclude selected ones
  const availableUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !selected.some((sel) => sel.bom_id === user.bom_id) &&
        (user.bom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bom_type?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, selected, searchQuery]);

  const handleFocusInput = () => {
    setIsDropdownOpen(true);
  };

  const handleSelectUser = (user: Product) => {
    if (!selected.some((sel) => sel.bom_id === user.bom_id)) {
      onSelectionChange([...selected, user]);
      setSearchQuery("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (userId: number) => {
    if (lockedSelected.includes(userId)) {
      return;
    }
    onSelectionChange(selected.filter((user) => user.bom_id !== userId));
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
    } else if (e.key === "Enter" && availableUsers.length > 0) {
      e.preventDefault();
      handleSelectUser(availableUsers[0]);
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
        {selected.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
            {selected.map((user) => {
              const isLocked = lockedSelected.includes(user.bom_id);
              return (
                <Pills
                  key={`pill-${user.bom_id}`}
                  text={`${user.bom_name} (${user.bom_type})`}
                  onClick={() => handleRemoveUser(user.bom_id)}
                  removable={!isLocked}
                />
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 w-full">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={selected.length === 0 ? placeholder : "Search BOM..."}
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
          {availableUsers.length > 0 ? (
            <ul className="overflow-y-auto max-h-[250px] p-1">
              {availableUsers.map((user) => (
                <li
                  key={user.bom_id}
                  className={cn(
                    "px-3 py-2 rounded-md cursor-pointer",
                    "transition-colors duration-150",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  )}
                  onClick={() => handleSelectUser(user)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectUser(user);
                    }
                  }}
                  tabIndex={0}
                >
                  <div>{user.bom_name}</div>
                  {user.bom_type && (
                    <div className="text-muted-foreground mt-0.5">
                      {user.bom_type}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-muted-foreground">
              {searchQuery
                ? "No BOM found matching your search"
                : "No BOM available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
