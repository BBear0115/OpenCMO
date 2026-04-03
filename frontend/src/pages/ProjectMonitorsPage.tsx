import { useParams } from "react-router";
import { useMonitors, useDeleteMonitor } from "../hooks/useMonitors";
import { useProjectSummary } from "../hooks/useProject";
import { MonitorList } from "../components/monitors/MonitorList";
import { ProjectHeader } from "../components/project/ProjectHeader";
import { ProjectTabs } from "../components/project/ProjectTabs";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { EmptyState } from "../components/common/EmptyState";
import { useI18n } from "../i18n";

export function ProjectMonitorsPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data, isLoading: projectLoading, error } = useProjectSummary(projectId);
  const { data: allMonitors, isLoading: monitorsLoading } = useMonitors();
  const deleteMonitor = useDeleteMonitor();
  const { t } = useI18n();

  if (projectLoading || monitorsLoading) return <LoadingSpinner />;
  if (error || !data) return <ErrorAlert message={t("common.projectNotFound")} />;

  const monitors = allMonitors?.filter((m) => m.project_id === projectId) ?? [];

  return (
    <div>
      <ProjectHeader project={data.project} isPaused={data.is_paused} />
      <ProjectTabs projectId={projectId} />

      <div className="space-y-4">
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
    </div>
  );
}
