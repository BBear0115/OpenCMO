import { Link, useLocation } from "react-router";
import { useI18n } from "../../i18n";
import type { TranslationKey } from "../../i18n";

const OVERVIEW_TAB = { path: "", labelKey: "project.overview" as const };

const TAB_GROUPS: Array<{
  titleKey: TranslationKey;
  tabs: Array<{ path: string; labelKey: TranslationKey }>;
}> = [
  {
    titleKey: "project.tabGroupObserve",
    tabs: [
      { path: "/seo", labelKey: "project.seo" },
      { path: "/geo", labelKey: "project.geo" },
      { path: "/serp", labelKey: "project.serp" },
      { path: "/community", labelKey: "project.community" },
      { path: "/graph", labelKey: "project.graph" },
    ],
  },
  {
    titleKey: "project.tabGroupDecide",
    tabs: [
      { path: "/reports", labelKey: "project.reports" },
      { path: "/performance", labelKey: "project.performance" },
    ],
  },
  {
    titleKey: "project.tabGroupExecute",
    tabs: [
      { path: "/brand-kit", labelKey: "project.brandKit" },
      { path: "/github-leads", labelKey: "project.githubLeads" },
      { path: "/monitors", labelKey: "project.monitors" },
    ],
  },
];

export function ProjectTabs({ projectId }: { projectId: number }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const base = `/projects/${projectId}`;

  const renderTab = (path: string, labelKey: TranslationKey) => {
    const to = `${base}${path}`;
    const active = pathname === to;
    return (
      <Link
        key={path}
        to={to}
        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
            : "text-slate-500 hover:bg-black/[0.02] hover:text-slate-900"
        }`}
      >
        {t(labelKey)}
      </Link>
    );
  };

  return (
    <div className="mb-8 space-y-3">
      <div className="inline-flex max-w-full items-center gap-1 rounded-2xl bg-slate-100/80 p-1.5">
        {renderTab(OVERVIEW_TAB.path, OVERVIEW_TAB.labelKey)}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {TAB_GROUPS.map((group) => (
          <div
            key={group.titleKey}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5"
          >
            <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t(group.titleKey)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {group.tabs.map(({ path, labelKey }) => renderTab(path, labelKey))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
