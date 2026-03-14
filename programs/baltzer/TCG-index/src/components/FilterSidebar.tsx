import { useState } from 'react';
import { Filter, Search, SlidersHorizontal, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  minProfit: number;
  maxBudget: number;
  condition: string[];
  minMargin: number;
}

const conditions = [
  { id: 'mint', label: 'Mint (M)', color: 'text-profit' },
  { id: 'near-mint', label: 'Near Mint (NM)', color: 'text-primary' },
  { id: 'excellent', label: 'Excellent (EX)', color: 'text-warning' },
  { id: 'good', label: 'Good (GD)', color: 'text-muted-foreground' },
];

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    minProfit: 5,
    maxBudget: 500,
    condition: ['mint', 'near-mint'],
    minMargin: 10,
  });

  const [expandedSections, setExpandedSections] = useState({
    profit: true,
    condition: true,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCondition = (conditionId: string) => {
    setFilters(prev => ({
      ...prev,
      condition: prev.condition.includes(conditionId)
        ? prev.condition.filter(c => c !== conditionId)
        : [...prev.condition, conditionId]
    }));
  };

  return (
    <aside className="w-72 border-r border-border bg-card/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Filters</h2>
          </div>
          <button className="text-xs text-primary hover:underline">Reset</button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cards..."
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg",
              "bg-secondary border border-border",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all duration-150"
            )}
          />
        </div>
      </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profit Section */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('profit')}
            className="w-full flex items-center justify-between text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-profit" />
              Profit Settings
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.profit && "rotate-180"
            )} />
          </button>
          
          {expandedSections.profit && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Min. Profit ($)
                </label>
                <input
                  type="number"
                  value={filters.minProfit}
                  onChange={(e) => setFilters(prev => ({ ...prev, minProfit: Number(e.target.value) }))}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg font-mono text-sm",
                    "bg-secondary border border-border",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Max. Budget ($)
                </label>
                <input
                  type="number"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: Number(e.target.value) }))}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg font-mono text-sm",
                    "bg-secondary border border-border",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Min. Margin: <span className="text-profit font-mono">{filters.minMargin}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.minMargin}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMargin: Number(e.target.value) }))}
                  className="w-full accent-profit"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Condition Section */}
        <div className="space-y-3 pt-2 border-t border-border">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full flex items-center justify-between text-sm font-medium pt-2"
          >
            <span>Card Condition</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.condition && "rotate-180"
            )} />
          </button>
          
          {expandedSections.condition && (
            <div className="space-y-2 pt-2 animate-fade-in">
              {conditions.map((condition) => (
                <label
                  key={condition.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                    "hover:bg-secondary/50",
                    filters.condition.includes(condition.id) && "bg-secondary"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={filters.condition.includes(condition.id)}
                    onChange={() => toggleCondition(condition.id)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className={cn("text-sm", condition.color)}>{condition.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <div className="p-4 border-t border-border">
        <button className={cn(
          "w-full py-3 rounded-lg font-medium transition-all",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "flex items-center justify-center gap-2",
          "hover:glow-primary"
        )}>
          <RefreshCw className="w-4 h-4" />
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
