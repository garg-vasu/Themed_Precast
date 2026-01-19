import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Pills from "./Pills";

export interface Stockyard {
  id: number;
  yard_name: string;
  location: string;
  capacity: number;
  current_stock: number;
  created_at: string;
  updated_at: string;
  tenant_id: number;
}

interface MultiSelectProps {
  users: Stockyard[];
  onSelectionChange: (selectedUsers: number[]) => void;
  placeholder?: string;
  initialSelected?: number[];
  lockedSelected?: number[];
}

export default function MultiStockyard({
  users,
  onSelectionChange,
  placeholder = "Select stockyards...",
  initialSelected = [],
  lockedSelected = [],
}: MultiSelectProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedUsers(initialSelected);
  }, [initialSelected]);

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
        !selectedUsers.includes(user.id) &&
        (user.yard_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.location?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, selectedUsers, searchQuery]);

  const handleFocusInput = () => {
    setIsDropdownOpen(true);
  };

  const handleSelectUser = (user: Stockyard) => {
    if (!selectedUsers.includes(user.id)) {
      const updatedSelected = [...selectedUsers, user.id];
      setSelectedUsers(updatedSelected);
      onSelectionChange(updatedSelected);
      setSearchQuery("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (userId: number) => {
    if (lockedSelected.includes(userId)) {
      return;
    }
    const updatedSelected = selectedUsers.filter((id) => id !== userId);
    setSelectedUsers(updatedSelected);
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
        {selectedUsers.length > 0 && (
          <div className="flex flex-row flex-wrap items-center gap-1.5 w-full">
            {selectedUsers.map((userId) => {
              const user = users.find((user) => user.id === userId);
              const isLocked = lockedSelected.includes(userId);
              return (
                user && (
                  <Pills
                    key={`pill-${userId}`}
                    text={user.yard_name}
                    onClick={() => handleRemoveUser(userId)}
                    removable={!isLocked}
                  />
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
              selectedUsers.length === 0 ? placeholder : "Search stockyards..."
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
          {availableUsers.length > 0 ? (
            <ul className="overflow-y-auto max-h-[250px] p-1">
              {availableUsers.map((user) => (
                <li
                  key={user.id}
                  className={cn(
                    "px-3 py-2 rounded-md cursor-pointer",
                    "text-sm transition-colors duration-150",
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
                  <div className="font-medium">{user.yard_name}</div>
                  {user.location && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {user.location}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">
              {searchQuery
                ? "No stockyards found matching your search"
                : "No stockyards available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
