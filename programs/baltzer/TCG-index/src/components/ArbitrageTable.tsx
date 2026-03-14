import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, TrendingUp, Clock, Zap, Loader2, AlertCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ArbitrageOpportunity } from '@/types/arbitrage';
import { useArbitrageOpportunities } from '@/hooks/useArbitrage';
import { useScrapingStats } from '@/hooks/useScrapingStats';
import { Button } from '@/components/ui/button';

interface ArbitrageTableProps {
  onRowClick?: (opportunity: ArbitrageOpportunity) => void;
}

type SortField = 'profitMargin' | 'netProfit' | 'buyPrice' | 'cardName';
type SortDirection = 'asc' | 'desc';

export function ArbitrageTable({ onRowClick }: ArbitrageTableProps) {
  const [sortField, setSortField] = useState<SortField>('profitMargin');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { data: opportunities = [], isLoading, error } = useArbitrageOpportunities();
  const { data: scrapingStats } = useScrapingStats();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...opportunities].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (typeof a[sortField] === 'string') {
      return multiplier * (a[sortField] as string).localeCompare(b[sortField] as string);
    }
    return multiplier * ((a[sortField] as number) - (b[sortField] as number));
  });

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'text-profit text-glow-profit';
    if (margin >= 20) return 'text-profit';
    if (margin >= 10) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 30) return 'bg-profit/20 border-profit/40';
    if (margin >= 20) return 'bg-profit/10 border-profit/20';
    if (margin >= 10) return 'bg-warning/10 border-warning/20';
    return 'bg-secondary border-border';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        <p>Failed to load opportunities</p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    const tcg = scrapingStats?.marketBreakdown.tcgPlayer.snapshots ?? 0;
    const cm = scrapingStats?.marketBreakdown.cardmarket.snapshots ?? 0;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No arbitrage opportunities yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arbitrage needs price data from <strong>both</strong> TCGPlayer and Cardmarket for the same product.
        </p>
        <div className="text-xs text-muted-foreground mb-6 p-4 rounded-lg bg-secondary/50 w-full text-left">
          <p className="font-medium text-foreground mb-2">Your data:</p>
          <p>• TCGPlayer snapshots: {tcg}</p>
          <p>• Cardmarket snapshots: {cm}</p>
          <p className="mt-2">
            {tcg === 0 && cm > 0 && 'Run the worker and trigger a scrape from Settings to add TCGPlayer prices.'}
            {tcg > 0 && cm === 0 && 'Run the Cardmarket batch scraper to add Cardmarket prices.'}
            {tcg === 0 && cm === 0 && 'Run scrapes to populate price data from both markets.'}
            {tcg > 0 && cm > 0 && 'Ensure both markets have snapshots for the same product_keys. Run compute_arbitrage_opportunities() in Hosted DB.'}
          </p>
        </div>
        <Link to="/settings">
          <Button className="gap-2">
            <Settings className="w-4 h-4" />
            Go to Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table Header Stats */}
      <div className="px-6 py-4 border-b border-border bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-profit" />
            <span className="text-sm font-medium">{opportunities.length} Opportunities</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Updated 2 min ago</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total Potential:</span>
          <span className="font-mono text-profit font-semibold">
            ${opportunities.reduce((sum, o) => sum + o.netProfit, 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3">
                <button 
                  onClick={() => handleSort('cardName')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Card <SortIcon field="cardName" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">Set / Condition</span>
              </th>
              <th className="text-right px-4 py-3">
                <button 
                  onClick={() => handleSort('buyPrice')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Buy <SortIcon field="buyPrice" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">Sell</span>
              </th>
              <th className="text-right px-4 py-3">
                <button 
                  onClick={() => handleSort('profitMargin')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Margin <SortIcon field="profitMargin" />
                </button>
              </th>
              <th className="text-right px-6 py-3">
                <button 
                  onClick={() => handleSort('netProfit')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Profit <SortIcon field="netProfit" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((opportunity, index) => (
              <tr
                key={opportunity.id}
                onClick={() => onRowClick?.(opportunity)}
                className={cn(
                  "border-b border-border/50 cursor-pointer transition-all duration-150",
                  "hover:bg-secondary/50",
                  index % 2 === 0 ? "bg-transparent" : "bg-card/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded bg-secondary/50 border border-border flex items-center justify-center text-xs text-muted-foreground">
                      IMG
                    </div>
                    <div>
                      <p className="font-medium text-sm">{opportunity.cardName}</p>
                      <p className="text-xs text-muted-foreground">{opportunity.rarity}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-muted-foreground">{opportunity.set}</p>
                  <p className="text-xs text-primary">{opportunity.condition}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="font-mono text-sm">${opportunity.buyPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{opportunity.buyMarket}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="font-mono text-sm">${opportunity.sellPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{opportunity.sellMarket}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-semibold border",
                    getMarginBadge(opportunity.profitMargin),
                    getMarginColor(opportunity.profitMargin)
                  )}>
                    <TrendingUp className="w-3 h-3" />
                    {opportunity.profitMargin.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className={cn(
                    "font-mono text-sm font-semibold",
                    getMarginColor(opportunity.profitMargin)
                  )}>
                    +${opportunity.netProfit.toLocaleString()}
                  </p>
                  <button className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                    View <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
