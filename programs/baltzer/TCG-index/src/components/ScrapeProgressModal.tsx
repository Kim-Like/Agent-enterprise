import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, Square } from 'lucide-react';
import { getScrapeJobStatus, cancelScrapeJob, type ScrapeJobStatusResponse } from '@/lib/api/scraping';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ScrapeProgressModalProps {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ScrapeProgressModal({
  jobId,
  open,
  onClose,
  onComplete,
}: ScrapeProgressModalProps) {
  const queryClient = useQueryClient();
  const [isStopping, setIsStopping] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ['scrape-job-status', jobId],
    queryFn: () => getScrapeJobStatus(jobId!),
    enabled: open && !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data?.job;
      if (job?.status === 'completed' || job?.status === 'failed' || job?.status === 'cancelled') {
        return false;
      }
      return 4000; // Poll every 4 seconds
    },
  });

  const job = data?.job;
  const recentFailures = data?.recentFailures ?? [];

  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed' || job?.status === 'cancelled') {
      onComplete?.();
    }
  }, [job?.status, onComplete]);

  const handleStop = async () => {
    if (!jobId || isStopping) return;
    setIsStopping(true);
    try {
      await cancelScrapeJob(jobId);
      queryClient.invalidateQueries({ queryKey: ['scrape-job-status', jobId] });
      queryClient.invalidateQueries({ queryKey: ['active-scrape-job'] });
      onComplete?.();
    } catch {
      setIsStopping(false);
    }
  };

  const progressPercent =
    job && job.progress_total > 0
      ? Math.round((job.progress_done / job.progress_total) * 100)
      : 0;

  const getStatusIcon = () => {
    if (!job) return null;
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-profit" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'running':
      case 'queued':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Scrape Job {job?.status ?? 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {job && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono">
                  {job.progress_done} / {job.progress_total}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {job.last_log && (
              <p className="text-sm text-muted-foreground">{job.last_log}</p>
            )}

            {job.error && (
              <p className="text-sm text-destructive">{job.error}</p>
            )}

            {recentFailures.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Recent failures
                </p>
                <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                  {recentFailures.map((item) => (
                    <li key={item.id} className="text-destructive truncate">
                      {item.product_key} ({item.market}): {item.error ?? 'Unknown'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
              <p className="text-xs text-muted-foreground">
                {job.status === 'completed'
                  ? 'Arbitrage opportunities have been updated. Refresh the dashboard to see changes.'
                  : job.status === 'cancelled'
                    ? 'Job was stopped. Processed items are saved.'
                    : 'Some items failed. Check the worker logs for details.'}
              </p>
            )}

            {(job.status === 'running' || job.status === 'queued') && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={handleStop}
                disabled={isStopping}
              >
                <Square className="w-4 h-4" />
                {isStopping ? 'Stopping...' : 'Stop scrape'}
              </Button>
            )}
          </div>
        )}

        {!job && jobId && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
