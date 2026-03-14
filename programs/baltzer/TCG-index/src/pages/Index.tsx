import { useState } from 'react';
import { Header } from '@/components/Header';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ArbitrageTable } from '@/components/ArbitrageTable';
import { CardDetailModal } from '@/components/CardDetailModal';
import { useGameStore } from '@/stores/gameStore';
import { useArbitrageStats } from '@/hooks/useArbitrage';
import type { ArbitrageOpportunity } from '@/types/arbitrage';
import { BarChart3, Zap, DollarSign, TrendingUp, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedCard, setSelectedCard] = useState<ArbitrageOpportunity | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedGame } = useGameStore();
  const { data: stats } = useArbitrageStats();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "lg:hidden fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg",
            "bg-primary text-primary-foreground",
            "hover:glow-primary transition-all"
          )}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Filter Sidebar */}
        <div className={cn(
          "fixed lg:relative inset-y-0 left-0 z-30 transform transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <FilterSidebar />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-background/50 backdrop-blur-sm z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Bar */}
          <div className="px-6 py-4 border-b border-border bg-card/20">
            <div className="flex flex-wrap items-center gap-4">
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  borderColor: selectedGame.color + '40',
                  backgroundColor: selectedGame.color + '10'
                }}
              >
                <span className="text-xs text-muted-foreground">Active:</span>
                <span className="font-semibold text-sm" style={{ color: selectedGame.color }}>
                  {selectedGame.name}
                </span>
              </div>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Opportunities</p>
                    <p className="font-mono font-semibold">{stats?.totalOpportunities ?? 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-profit" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Margin</p>
                    <p className="font-mono font-semibold text-profit">{stats?.avgMargin ?? 0}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-profit" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best Deal</p>
                    <p className="font-mono font-semibold text-profit">+${stats?.bestDeal?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Potential</p>
                    <p className="font-mono font-semibold">${stats?.totalPotential?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <ArbitrageTable onRowClick={setSelectedCard} />
        </main>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal 
        opportunity={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
};

export default Index;
