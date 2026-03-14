import { useState } from 'react';
import { Header } from '@/components/Header';
import { 
  Database, 
  RefreshCw, 
  Activity, 
  Clock, 
  Server, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  ArrowLeft,
  Zap,
  Flame,
  Snowflake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrapingStats, useRecentFetchJobs, useActiveScrapeJob } from '@/hooks/useScrapingStats';
import { useArbitrageStats } from '@/hooks/useArbitrage';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { startScrapeJob, type ScrapeMode } from '@/lib/api/scraping';
import { ScrapeProgressModal } from '@/components/ScrapeProgressModal';
import { CurrentScrapeCard } from '@/components/CurrentScrapeCard';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: scrapingStats, isLoading: statsLoading, refetch: refetchStats } = useScrapingStats();
  const { data: arbStats, isLoading: arbLoading, refetch: refetchArb } = useArbitrageStats();
  const { data: recentJobs, isLoading: jobsLoading } = useRecentFetchJobs(10);
  const { data: activeJob } = useActiveScrapeJob();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [startingMode, setStartingMode] = useState<ScrapeMode | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setIsRefreshing(false);
  };

  const handleStartScrape = async (mode: ScrapeMode) => {
    setStartingMode(mode);
    try {
      const { jobId } = await startScrapeJob(mode);
      setActiveJobId(jobId);
      setScrapeModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['active-scrape-job'] });
      toast.success(`Scrape job started (${mode} tier)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start scrape');
    } finally {
      setStartingMode(null);
    }
  };

  const handleViewScrapeDetails = (jobId: string) => {
    setActiveJobId(jobId);
    setScrapeModalOpen(true);
  };

  const handleScrapeComplete = () => {
    refetchStats();
    refetchArb();
    queryClient.invalidateQueries({ queryKey: ['scraping-stats'] });
    queryClient.invalidateQueries({ queryKey: ['active-scrape-job'] });
    queryClient.invalidateQueries({ queryKey: ['arbitrage-opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['arbitrage-stats'] });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-profit" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Settings & Data Overview</h1>
                <p className="text-muted-foreground text-sm">Monitor scraping status and data freshness</p>
              </div>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh Stats
            </Button>
          </div>

          {/* Data Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Products */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-mono font-bold">
                    {statsLoading ? '...' : scrapingStats?.totalProducts.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Snapshots */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price Snapshots</p>
                  <p className="text-2xl font-mono font-bold">
                    {statsLoading ? '...' : scrapingStats?.totalSnapshots.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Arbitrage Opportunities */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-profit/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-profit" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opportunities</p>
                  <p className="text-2xl font-mono font-bold text-profit">
                    {arbLoading ? '...' : arbStats?.totalOpportunities || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Data Update</p>
                  <p className="text-lg font-medium">
                    {statsLoading ? '...' : formatDate(scrapingStats?.lastSnapshotAt || null)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TCGPlayer */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">TCGPlayer</h3>
                    <p className="text-sm text-muted-foreground">US Market</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Snapshots</span>
                  <span className="font-mono">
                    {statsLoading ? '...' : scrapingStats?.marketBreakdown.tcgPlayer.snapshots.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Fetched</span>
                  <span className="font-mono">
                    {statsLoading ? '...' : formatDate(scrapingStats?.marketBreakdown.tcgPlayer.lastFetch || null)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cardmarket */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Server className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cardmarket</h3>
                    <p className="text-sm text-muted-foreground">EU Market</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Snapshots</span>
                  <span className="font-mono">
                    {statsLoading ? '...' : scrapingStats?.marketBreakdown.cardmarket.snapshots.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Fetched</span>
                  <span className="font-mono">
                    {statsLoading ? '...' : formatDate(scrapingStats?.marketBreakdown.cardmarket.lastFetch || null)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Queue Status */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Fetch Job Queue</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Pending: <span className="font-mono">{scrapingStats?.pendingJobs || 0}</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-profit" />
                  Completed: <span className="font-mono">{scrapingStats?.completedJobs || 0}</span>
                </span>
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Failed: <span className="font-mono">{scrapingStats?.failedJobs || 0}</span>
                </span>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Market</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">URL</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job) => (
                      <tr key={job.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-2 px-3">{getJobStatusIcon(job.status)}</td>
                        <td className="py-2 px-3 font-mono">{job.market}</td>
                        <td className="py-2 px-3">{job.job_type}</td>
                        <td className="py-2 px-3 max-w-xs truncate text-muted-foreground">{job.url}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No fetch jobs found</p>
                <p className="text-sm mt-1">Jobs will appear here once you start the scraper</p>
              </div>
            )}
          </div>

          {/* Currently Running Scrape */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Current Scrape</h3>
            <CurrentScrapeCard onViewDetails={handleViewScrapeDetails} />
          </div>

          {/* Run Scrape Controls */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Run Scrape
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a scraping job. Run the worker to process: <code className="bg-secondary px-1 rounded text-xs">npm run scrape-worker</code>.
              Uses Top 99 (Cardmarket + TCGPlayer). Requires PROXY_ENDPOINT in .env.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleStartScrape('hot')}
                disabled={!!startingMode || !!activeJob}
                className="gap-2"
                variant="default"
              >
                {startingMode === 'hot' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Flame className="w-4 h-4" />
                )}
                Run Hot Tier Scrape
              </Button>
              <Button
                onClick={() => handleStartScrape('warm')}
                disabled={!!startingMode || !!activeJob}
                variant="secondary"
                className="gap-2"
              >
                {startingMode === 'warm' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Run Warm Tier Scrape
              </Button>
              <Button
                onClick={() => handleStartScrape('cold')}
                disabled={!!startingMode || !!activeJob}
                variant="outline"
                className="gap-2"
              >
                {startingMode === 'cold' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Snowflake className="w-4 h-4" />
                )}
                Run Cold Tier Scrape
              </Button>
            </div>
          </div>

          {/* Scraping Instructions */}
          <div className="p-6 rounded-xl bg-secondary/30 border border-border">
            <h3 className="font-semibold text-lg mb-3">How it works</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-foreground">Hot:</strong> High-margin candidates (top 20 products)</li>
                <li><strong className="text-foreground">Warm:</strong> Medium priority (up to 50 products)</li>
                <li><strong className="text-foreground">Cold:</strong> All products with marketplace URLs</li>
              </ul>
              <p className="pt-2 border-t border-border">
                Ensure products exist in <code className="bg-secondary px-1 rounded">products</code> and{' '}
                <code className="bg-secondary px-1 rounded">market_products</code> with valid URLs. Run the worker with{' '}
                <code className="bg-secondary px-1 rounded">DRY_RUN=1</code> to test the flow without scraping.
              </p>
            </div>
          </div>
        </div>
      </main>

      <ScrapeProgressModal
        jobId={activeJobId}
        open={scrapeModalOpen}
        onClose={() => {
          setScrapeModalOpen(false);
          setActiveJobId(null);
        }}
        onComplete={handleScrapeComplete}
      />
    </div>
  );
}
