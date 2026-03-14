import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Clock, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceTrendWithProduct } from '@/types/trends';
import type { Market } from '@/types/database';

interface MarketTrendTableProps {
  data: PriceTrendWithProduct[];
  isLoading: boolean;
  error: Error | null;
  type: 'gainers' | 'decliners';
  market: Market;
  onRowClick?: (trend: PriceTrendWithProduct) => void;
}

type SortField = 'price_change_pct' | 'price_change' | 'current_price' | 'card_name';
type SortDirection = 'asc' | 'desc';

export function MarketTrendTable({
  data,
  isLoading,
  error,
  type,
  market,
  onRowClick,
}: MarketTrendTableProps) {
  const [sortField, setSortField] = useState<SortField>('price_change_pct');
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    type === 'gainers' ? 'desc' : 'asc'
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(type === 'gainers' ? 'desc' : 'asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'card_name') {
      return multiplier * a.card_name.localeCompare(b.card_name);
    }
    return multiplier * ((a[sortField] as number) - (b[sortField] as number));
  });

  const formatPrice = (cents: number, currency: 'USD' | 'EUR') => {
    const value = cents / 100;
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (cents: number, currency: 'USD' | 'EUR') => {
    const value = cents / 100;
    const symbol = currency === 'EUR' ? '€' : '$';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${symbol}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getChangeColor = (pct: number) => {
    if (pct > 0) return 'text-profit';
    if (pct < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getChangeBadge = (pct: number) => {
    if (pct > 20) return 'bg-profit/20 border-profit/40';
    if (pct > 0) return 'bg-profit/10 border-profit/20';
    if (pct < -20) return 'bg-destructive/20 border-destructive/40';
    if (pct < 0) return 'bg-destructive/10 border-destructive/20';
    return 'bg-secondary border-border';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const TrendIcon = type === 'gainers' ? TrendingUp : TrendingDown;
  const trendColor = type === 'gainers' ? 'text-profit' : 'text-destructive';
  const marketColor = market === 'TCGPlayer' ? 'text-blue-500' : 'text-orange-500';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 text-destructive">
        <p>Failed to load trends</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No {type} data yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Price trends require at least two scrapes for the same products. Run the scraper again
          after some time has passed to see {type === 'gainers' ? 'rising' : 'falling'} prices.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendIcon className={cn('w-4 h-4', trendColor)} />
          <span className="text-sm font-medium">
            {data.length} {type === 'gainers' ? 'Rising' : 'Falling'}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded', marketColor, 'bg-current/10')}>
            {market}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">Since last scrape</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('card_name')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Card <SortIcon field="card_name" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button
                  onClick={() => handleSort('current_price')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Price <SortIcon field="current_price" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button
                  onClick={() => handleSort('price_change')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  Change <SortIcon field="price_change" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button
                  onClick={() => handleSort('price_change_pct')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
                >
                  % <SortIcon field="price_change_pct" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((trend, index) => (
              <tr
                key={`${trend.product_key}-${trend.condition_norm}`}
                onClick={() => onRowClick?.(trend)}
                className={cn(
                  'border-b border-border/50 cursor-pointer transition-all duration-150',
                  'hover:bg-secondary/50',
                  index % 2 === 0 ? 'bg-transparent' : 'bg-card/20'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-11 rounded bg-secondary/50 border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                      IMG
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{trend.card_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{trend.set_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-mono text-sm">
                    {formatPrice(trend.current_price, trend.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    was {formatPrice(trend.previous_price, trend.currency)}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className={cn('font-mono text-sm', getChangeColor(trend.price_change_pct))}>
                    {formatChange(trend.price_change, trend.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(trend.current_fetched_at)}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-semibold border',
                      getChangeBadge(trend.price_change_pct),
                      getChangeColor(trend.price_change_pct)
                    )}
                  >
                    {trend.price_change_pct > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {trend.price_change_pct > 0 ? '+' : ''}
                    {trend.price_change_pct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
