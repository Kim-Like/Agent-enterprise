import { X, ExternalLink, TrendingUp, TrendingDown, Clock, Tag, Store } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { ArbitrageOpportunity } from '@/types/arbitrage';

interface CardDetailModalProps {
  opportunity: ArbitrageOpportunity | null;
  onClose: () => void;
}

// Build price history from opportunity (buy = low, sell = high - simplified until we have historical API)
const getPriceHistoryData = (opportunity: ArbitrageOpportunity) => [
  { date: 'Buy', price: opportunity.buyPrice },
  { date: 'Sell', price: opportunity.sellPrice },
];

// Real marketplace data from the opportunity
const getListings = (opportunity: ArbitrageOpportunity) => [
  { marketplace: opportunity.buyMarket, price: opportunity.buyPrice, condition: opportunity.condition, label: 'Buy here' },
  { marketplace: opportunity.sellMarket, price: opportunity.sellPrice, condition: opportunity.condition, label: 'Sell here' },
];

export function CardDetailModal({ opportunity, onClose }: CardDetailModalProps) {
  if (!opportunity) return null;

  const priceHistory = getPriceHistoryData(opportunity);
  const listings = getListings(opportunity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-4xl max-h-[90vh] overflow-auto",
        "bg-card border border-border rounded-2xl shadow-2xl",
        "animate-scale-in"
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-6 flex items-start justify-between z-10">
          <div className="flex gap-4">
            {/* Card Image Placeholder */}
            <div className="w-24 h-32 rounded-lg bg-secondary/50 border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">
              Card Image
            </div>
            <div>
              <h2 className="text-2xl font-bold">{opportunity.cardName}</h2>
              <p className="text-muted-foreground">{opportunity.set}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
                  {opportunity.rarity}
                </span>
                <span className="px-2 py-1 rounded bg-secondary text-xs">
                  {opportunity.condition}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profit Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Buy Price</p>
              <p className="text-xl font-mono font-bold">${opportunity.buyPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{opportunity.buyMarket}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Sell Price</p>
              <p className="text-xl font-mono font-bold">${opportunity.sellPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{opportunity.sellMarket}</p>
            </div>
            <div className="p-4 rounded-xl bg-profit/10 border border-profit/20">
              <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
              <p className="text-xl font-mono font-bold text-profit">+${opportunity.netProfit.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-profit/10 border border-profit/20">
              <p className="text-xs text-muted-foreground mb-1">Margin</p>
              <p className="text-xl font-mono font-bold text-profit flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                {opportunity.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Buy vs Sell Comparison */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Buy vs Sell Price
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-profit" />
                  <span className="text-profit">{opportunity.profitMargin.toFixed(1)}%</span>
                </span>
                <span className="text-muted-foreground">margin</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Marketplace Listing */}
          <div className="rounded-xl bg-secondary/30 border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Marketplace Prices
              </h3>
            </div>
            <div className="divide-y divide-border">
              {listings.map((listing, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{listing.marketplace}</p>
                      <p className="text-xs text-muted-foreground">{listing.condition} • {listing.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-semibold">${listing.price.toLocaleString()}</p>
                    </div>
                    <button className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
