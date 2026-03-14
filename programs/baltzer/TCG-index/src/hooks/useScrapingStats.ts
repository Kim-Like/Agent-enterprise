import { useQuery } from '@tanstack/react-query';
import { getScrapingStats, getRecentFetchJobs, getActiveScrapeJob } from '@/lib/api/scraping';

export function useScrapingStats() {
  return useQuery({
    queryKey: ['scraping-stats'],
    queryFn: getScrapingStats,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });
}

export function useActiveScrapeJob(enabled: boolean = true) {
  return useQuery({
    queryKey: ['active-scrape-job'],
    queryFn: getActiveScrapeJob,
    enabled,
    staleTime: 0,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.status === 'running' || job?.status === 'queued') {
        return 3000; // Poll every 3s when active
      }
      return 10000; // Poll every 10s when idle
    },
  });
}

export function useRecentFetchJobs(limit: number = 20) {
  return useQuery({
    queryKey: ['recent-fetch-jobs', limit],
    queryFn: () => getRecentFetchJobs(limit),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
