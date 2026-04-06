"""Executor for report generation tasks."""

from __future__ import annotations

import asyncio

from opencmo import service


async def run_report_executor(ctx) -> None:
    task = ctx.task
    payload = task["payload"]
    event_tasks: list[asyncio.Task] = []

    def on_progress(event: dict) -> None:
        event_tasks.append(
            asyncio.create_task(
                ctx.emit(
                    event_type="progress",
                    phase=event.get("phase", ""),
                    status=event.get("status", ""),
                    summary=event.get("summary", ""),
                    payload=event,
                )
            )
        )

    try:
        result = await service.regenerate_project_report(
            payload["project_id"],
            payload["kind"],
            source_run_id=payload.get("source_run_id"),
            on_progress=on_progress,
        )
    finally:
        if event_tasks:
            await asyncio.gather(*event_tasks, return_exceptions=True)

    await ctx.complete(
        {
            "kind": payload["kind"],
            "summary": f"{payload['kind'].title()} report completed",
            "human_report_id": result.get("human", {}).get("id"),
            "human_version": result.get("human", {}).get("version"),
            "agent_report_id": result.get("agent", {}).get("id"),
            "agent_version": result.get("agent", {}).get("version"),
        }
    )
