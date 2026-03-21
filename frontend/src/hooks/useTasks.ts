import { useQuery } from "@tanstack/react-query";
import { getTask, getTaskFindings, getTaskRecommendations } from "../api/tasks";
import type { Finding, Recommendation } from "../types";

export function useTaskPoll(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId!),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });
}

export function useTaskFindings(taskId: string | null, enabled = true) {
  return useQuery<Finding[]>({
    queryKey: ["task-findings", taskId],
    queryFn: () => getTaskFindings(taskId!),
    enabled: !!taskId && enabled,
  });
}

export function useTaskRecommendations(taskId: string | null, enabled = true) {
  return useQuery<Recommendation[]>({
    queryKey: ["task-recommendations", taskId],
    queryFn: () => getTaskRecommendations(taskId!),
    enabled: !!taskId && enabled,
  });
}
