import { useState } from 'react';
import { Header } from '@/components/Header';
import { MarketTrendsView } from '@/components/MarketTrendsView';
import { useTrendStats } from '@/hooks/useTrends';
import type { Market } from '@/types/database';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Trends() {
  const [selectedMarket, setSelectedMarket] = useState<Market>('Cardmarket');
  const { data: stats } = useTrendStats();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Stats Bar */}
      <div className="px-6 py-4 border-b border-border bg-card/20">
        <div className="flex flex-wrap items-center gap-4">
          {/* Market Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMarket('TCGPlayer')}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                selectedMarket === 'TCGPlayer'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                  : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              TCGPlayer
            </button>
            <button
              onClick={() => setSelectedMarket('Cardmarket')}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                selectedMarket === 'Cardmarket'
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-500'
                  : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Cardmarket
            </button>
          </div>

          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Trends</p>
                <p className="font-mono font-semibold">{stats?.totalWithTrends ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-profit" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Biggest Gain</p>
                <p className="font-mono font-semibold text-profit">
                  +{stats?.biggestGainPct?.toFixed(1) ?? 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Biggest Drop</p>
                <p className="font-mono font-semibold text-destructive">
                  {stats?.biggestDropPct?.toFixed(1) ?? 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Activity className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Movement</p>
                <p className="font-mono font-semibold">
                  ±{Math.abs(stats?.avgGainerPct ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <MarketTrendsView market={selectedMarket} />
      </main>
    </div>
  );
}
