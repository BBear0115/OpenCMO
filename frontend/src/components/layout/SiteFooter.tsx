import { ExternalLink, Github, Link2 } from "lucide-react";
import { useI18n } from "../../i18n";

const GITHUB_REPO = "https://github.com/study8677/OpenCMO";
const FRIEND_LINKS = [
  {
    href: "https://okara.ai/",
    labelKey: "siteFooter.okara",
  },
] as const;

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-10 border-t border-slate-200/80 pt-6 pb-8 text-sm text-slate-500">
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">OpenCMO</p>
          <p className="max-w-sm leading-6 text-slate-500">
            {t("siteFooter.description")}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <Github size={14} />
            {t("siteFooter.sourceCode")}
          </p>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            {t("siteFooter.githubRepo")}
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <Link2 size={14} />
            {t("siteFooter.friendLinks")}
          </p>
          <div className="flex flex-wrap gap-2">
            {FRIEND_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                {t(link.labelKey)}
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
