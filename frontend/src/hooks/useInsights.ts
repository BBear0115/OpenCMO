import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInsights,
  getInsightsSummary,
  markAllInsightsRead,
  markInsightRead,
  type InsightRecord,
  type InsightsSummary,
} from "../api/insights";
import { useI18n } from "../i18n";

type ActionFeedItem = {
  type?: string;
  [key: string]: unknown;
};

export function useInsightsSummary(projectId?: number) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ["insights-summary", projectId ?? null, locale],
    queryFn: () => getInsightsSummary(projectId, locale),
    refetchInterval: 30_000,
  });
}

export function useInsights(projectId?: number, unread = false) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ["insights", projectId ?? null, unread, locale],
    queryFn: () => getInsights(projectId, unread, locale),
  });
}

export function useMarkInsightRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markInsightRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insights-summary"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useMarkAllInsightsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (projectId?: number) => markAllInsightsRead(projectId),
    onMutate: async (projectId?: number) => {
      await qc.cancelQueries({ queryKey: ["insights-summary"] });
      await qc.cancelQueries({ queryKey: ["insights"] });
      await qc.cancelQueries({ queryKey: ["action-feed"] });

      const previousSummaries = qc.getQueriesData<InsightsSummary>({ queryKey: ["insights-summary"] });
      const previousInsights = qc.getQueriesData<InsightRecord[]>({ queryKey: ["insights"] });
      const previousActionFeeds = qc.getQueriesData<ActionFeedItem[]>({ queryKey: ["action-feed"] });

      previousSummaries.forEach(([queryKey, old]) => {
        const queryProjectId = Array.isArray(queryKey) ? queryKey[1] : null;
        if (!old || (projectId !== undefined && queryProjectId !== projectId)) return;
        qc.setQueryData<InsightsSummary>(queryKey, {
          ...old,
          unread_count: 0,
          recent: [],
        });
      });

      previousInsights.forEach(([queryKey, old]) => {
        const queryProjectId = Array.isArray(queryKey) ? queryKey[1] : null;
        const unreadOnly = Array.isArray(queryKey) ? queryKey[2] : false;
        if (!old || (projectId !== undefined && queryProjectId !== projectId)) return;
        qc.setQueryData<InsightRecord[]>(
          queryKey,
          unreadOnly ? [] : old.map((insight) => ({ ...insight, read: true })),
        );
      });

      previousActionFeeds.forEach(([queryKey, old]) => {
        const queryProjectId = Array.isArray(queryKey) ? queryKey[1] : null;
        if (!old || (projectId !== undefined && queryProjectId !== projectId)) return;
        qc.setQueryData<ActionFeedItem[]>(
          queryKey,
          old.filter((item) => item.type !== "insight"),
        );
      });

      return { previousSummaries, previousInsights, previousActionFeeds };
    },
    onError: (_error, _projectId, context) => {
      context?.previousSummaries.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
      context?.previousInsights.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
      context?.previousActionFeeds.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["insights-summary"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["action-feed"] });
    },
  });
}
