import { ExternalLink } from "lucide-react";
import type { Project } from "../../types";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{project.brand_name}</h1>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {project.category}
          </span>
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          {project.url} <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
