import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  selectedCount?: number;
  bulkActions?: BulkAction[];
}

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filter,
  onFilterChange,
  filterOptions,
  selectedCount = 0,
  bulkActions = [],
}: AdminToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        <div className="relative w-full sm:w-[160px]">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCount > 0 && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant ?? "outline"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
