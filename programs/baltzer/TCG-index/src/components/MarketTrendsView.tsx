import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketTrendTable } from '@/components/MarketTrendTable';
import { useTopGainers, useTopDecliners } from '@/hooks/useTrends';
import type { Market } from '@/types/database';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTrendsViewProps {
  market: Market;
}

export function MarketTrendsView({ market }: MarketTrendsViewProps) {
  const [activeTab, setActiveTab] = useState<'gainers' | 'decliners'>('gainers');

  const {
    data: gainers = [],
    isLoading: loadingGainers,
    error: errorGainers,
  } = useTopGainers(market, 30);

  const {
    data: decliners = [],
    isLoading: loadingDecliners,
    error: errorDecliners,
  } = useTopDecliners(market, 30);

  const marketLabel = market === 'TCGPlayer' ? 'TCGPlayer' : 'Cardmarket';
  const marketColor = market === 'TCGPlayer' ? 'text-blue-500' : 'text-orange-500';

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'gainers' | 'decliners')}
        className="flex flex-col h-full"
      >
        <div className="px-4 py-2 border-b border-border">
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="gainers" className="gap-2">
              <TrendingUp className="w-4 h-4 text-profit" />
              Top Gainers
            </TabsTrigger>
            <TabsTrigger value="decliners" className="gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Top Decliners
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gainers" className="flex-1 m-0 overflow-hidden">
          <MarketTrendTable
            data={gainers}
            isLoading={loadingGainers}
            error={errorGainers}
            type="gainers"
            market={market}
          />
        </TabsContent>

        <TabsContent value="decliners" className="flex-1 m-0 overflow-hidden">
          <MarketTrendTable
            data={decliners}
            isLoading={loadingDecliners}
            error={errorDecliners}
            type="decliners"
            market={market}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
