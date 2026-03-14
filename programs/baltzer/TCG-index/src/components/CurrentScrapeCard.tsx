import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, ExternalLink, Zap, Flame, Snowflake, Square } from 'lucide-react';
import { useActiveScrapeJob } from '@/hooks/useScrapingStats';
import { useQueryClient } from '@tanstack/react-query';
import { cancelScrapeJob } from '@/lib/api/scraping';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CurrentScrapeCardProps {
  onViewDetails: (jobId: string) => void;
}

const modeIcons = {
  hot: Flame,
  warm: Zap,
  cold: Snowflake,
  custom: Zap,
};

export function CurrentScrapeCard({ onViewDetails }: CurrentScrapeCardProps) {
  const queryClient = useQueryClient();
  const { data: job, isLoading } = useActiveScrapeJob();
  const [isStopping, setIsStopping] = useState(false);

  const handleStop = async () => {
    if (!job?.id || isStopping) return;
    setIsStopping(true);
    try {
      await cancelScrapeJob(job.id);
      queryClient.invalidateQueries({ queryKey: ['active-scrape-job'] });
      queryClient.invalidateQueries({ queryKey: ['scrape-job-status', job.id] });
    } finally {
      setIsStopping(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!job) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border border-dashed">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">No scrape running</p>
            <p className="text-sm">Start a scrape below to populate price data</p>
          </div>
        </div>
      </div>
    );
  }

  const ModeIcon = modeIcons[job.mode] ?? Zap;
  const progressPercent =
    job.progress_total > 0 ? Math.round((job.progress_done / job.progress_total) * 100) : 0;
  const isRunning = job.status === 'running';
  const isQueued = job.status === 'queued';

  return (
    <div
      className={cn(
        'p-6 rounded-xl border',
        isRunning && 'bg-primary/5 border-primary/30',
        isQueued && 'bg-secondary/30 border-border'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              isRunning && 'bg-primary/20',
              isQueued && 'bg-secondary'
            )}
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ModeIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">
                {isRunning ? 'Scraping now' : 'Queued'}
                <span className="font-normal text-muted-foreground ml-1">
                  · {job.mode.charAt(0).toUpperCase() + job.mode.slice(1)} tier
                </span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {job.progress_done} / {job.progress_total} items
              {job.created_at && (
                <span className="ml-2">
                  · Started {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              )}
            </p>
            <div className="mt-2">
              <Progress value={progressPercent} className="h-2 w-48" />
            </div>
            {job.last_log && (
              <p className="text-xs text-muted-foreground mt-2 truncate">{job.last_log}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={handleStop}
            disabled={isStopping}
          >
            <Square className="w-3.5 h-3.5" />
            {isStopping ? 'Stopping...' : 'Stop'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onViewDetails(job.id)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View details
          </Button>
        </div>
      </div>
    </div>
  );
}
