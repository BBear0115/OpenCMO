import { useParams } from "react-router";
import { useMonitors, useDeleteMonitor } from "../hooks/useMonitors";
import { MonitorList } from "../components/monitors/MonitorList";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useI18n } from "../i18n";

export function ProjectMonitorsPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: allMonitors, isLoading } = useMonitors();
  const deleteMonitor = useDeleteMonitor();
  const { t } = useI18n();

  const monitors = allMonitors?.filter((m) => m.project_id === projectId) ?? [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {monitors.length === 0 ? (
        <EmptyState
          title={t("monitors.noMonitors")}
          description={t("monitors.noMonitorsDesc")}
        />
      ) : (
        <MonitorList
          monitors={monitors}
          onDelete={(id) => deleteMonitor.mutate(id)}
        />
      )}
    </div>
  );
}
