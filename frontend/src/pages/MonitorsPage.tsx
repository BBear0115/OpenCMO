import { useEffect, useState } from "react";
import { useMonitors, useCreateMonitor, useDeleteMonitor } from "../hooks/useMonitors";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { EmptyState } from "../components/common/EmptyState";
import { MonitorList } from "../components/monitors/MonitorList";
import { MonitorForm } from "../components/monitors/MonitorForm";
import { AnalysisDialog } from "../components/monitors/AnalysisDialog";
import { useTaskPoll } from "../hooks/useTasks";
import { useI18n } from "../i18n";
import { Loader2, Eye } from "lucide-react";

export function MonitorsPage() {
  const { data: monitors, isLoading, error } = useMonitors();
  const createMonitor = useCreateMonitor();
  const deleteMonitor = useDeleteMonitor();
  const { t, locale } = useI18n();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskUrl, setSelectedTaskUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Poll task to know when it finishes (for the minimized bar)
  const { data: taskData } = useTaskPoll(selectedTaskId);
  const taskDone = taskData?.status === "completed" || taskData?.status === "failed";

  useEffect(() => {
    if (!taskDone || !selectedTaskId || dialogOpen) return;

    const timeoutId = window.setTimeout(() => {
      setSelectedTaskId(null);
      setSelectedTaskUrl(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [dialogOpen, selectedTaskId, taskDone]);

  const handleSelectRun = (taskId: string, url: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskUrl(url);
    setDialogOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("monitors.title")}</h1>
      <MonitorForm
        onSubmit={async (data) => {
          const result = await createMonitor.mutateAsync({ ...data, locale });
          if (result.task_id) {
            handleSelectRun(result.task_id, data.url);
          }
        }}
        isLoading={createMonitor.isPending}
      />

      {/* Minimized analysis bar — shown when dialog is closed but task is still running */}
      {selectedTaskId && selectedTaskUrl && !dialogOpen && !taskDone && (
        <button
          onClick={() => setDialogOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 ring-1 ring-inset ring-indigo-200 transition-colors hover:bg-indigo-100"
        >
          <Loader2 size={16} className="animate-spin" />
          <span className="flex-1 truncate text-left">
            {t("monitors.aiAnalyzing")}: {selectedTaskUrl}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Eye size={14} />
            {t("monitors.viewDetails")}
          </span>
        </button>
      )}

      {!monitors?.length ? (
        <EmptyState
          title={t("monitors.noMonitors")}
          description={t("monitors.noMonitorsDesc")}
        />
      ) : (
        <MonitorList
          monitors={monitors}
          onDelete={(id) => deleteMonitor.mutate(id)}
          onSelectRun={handleSelectRun}
        />
      )}

      {selectedTaskId && dialogOpen && (
        <AnalysisDialog
          taskId={selectedTaskId}
          url={selectedTaskUrl ?? ""}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
