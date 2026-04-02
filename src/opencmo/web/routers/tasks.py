"""Tasks and scan runs API router."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from opencmo import storage
from opencmo.background import service as bg_service

router = APIRouter(prefix="/api/v1")


def _compat_status(status: str) -> str:
    if status in {"queued", "claimed"}:
        return "pending"
    if status == "cancel_requested":
        return "running"
    if status == "cancelled":
        return "failed"
    return status


def _progress_from_events(events: list[dict]) -> list[dict]:
    progress: list[dict] = []
    for event in events:
        if event["event_type"] != "progress":
            continue
        payload = event["payload"] or {}
        if payload:
            progress.append(payload)
            continue
        progress.append(
            {
                "stage": event["phase"],
                "status": event["status"],
                "summary": event["summary"],
            }
        )
    return progress


async def _serialize_scan_task(task: dict) -> dict:
    events = await bg_service.list_task_events(task["task_id"])
    payload = task["payload"]
    result = task["result"] or {}
    error = task["error"] or {}
    return {
        "task_id": task["task_id"],
        "monitor_id": payload["monitor_id"],
        "project_id": task["project_id"],
        "job_type": payload["job_type"],
        "status": _compat_status(task["status"]),
        "created_at": task["created_at"],
        "completed_at": task["completed_at"],
        "error": error.get("message"),
        "progress": _progress_from_events(events),
        "run_id": result.get("run_id"),
        "summary": result.get("summary") or error.get("message") or "",
        "findings_count": result.get("findings_count", 0),
        "recommendations_count": result.get("recommendations_count", 0),
    }


@router.get("/tasks")
async def api_v1_tasks():
    tasks = await bg_service.list_tasks(kind="scan")
    return JSONResponse([await _serialize_scan_task(task) for task in tasks])


@router.get("/tasks/{task_id}")
async def api_v1_task(task_id: str):
    record = await bg_service.get_task(task_id)
    if record and record["kind"] == "scan":
        return JSONResponse(await _serialize_scan_task(record))

    from opencmo.web import task_registry

    legacy = task_registry.get_task(task_id)
    if not legacy:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return JSONResponse(legacy.to_dict())


@router.get("/tasks/{task_id}/findings")
async def api_v1_task_findings(task_id: str):
    return JSONResponse(await storage.get_task_findings(task_id))


@router.get("/tasks/{task_id}/recommendations")
async def api_v1_task_recommendations(task_id: str):
    return JSONResponse(await storage.get_task_recommendations(task_id))


@router.get("/monitors/{monitor_id}/runs")
async def api_v1_monitor_runs(monitor_id: int):
    return JSONResponse(await storage.list_scan_runs_by_monitor(monitor_id))
