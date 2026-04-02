"""Server-Sent Events router for real-time task progress streaming."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from starlette.responses import StreamingResponse

from opencmo.background import service as bg_service
from opencmo.web.routers.tasks import _serialize_scan_task

router = APIRouter(prefix="/api/v1")


@router.get("/tasks/{task_id}/events")
async def api_v1_task_events(task_id: str):
    """Stream task progress events via Server-Sent Events (SSE).

    Behaviour:
    1. Immediately replays all existing progress events (catch-up).
    2. Then polls for new events every 500ms until the task completes.
    3. Sends a ``done`` event with the final task state and closes.

    If the task is already complete when the request arrives, the full
    history + done event is sent in one batch (no long-poll).
    """
    record = await bg_service.get_task(task_id)
    if record and record["kind"] == "scan":
        async def _background_event_stream():
            cursor = 0

            while True:
                events = await bg_service.list_task_events(task_id)
                while cursor < len(events):
                    event = events[cursor]
                    cursor += 1
                    if event["event_type"] != "progress":
                        continue
                    payload = event["payload"] or {
                        "stage": event["phase"],
                        "status": event["status"],
                        "summary": event["summary"],
                    }
                    yield f"data: {json.dumps({'type': 'progress', **payload}, ensure_ascii=False)}\n\n"

                current = await bg_service.get_task(task_id)
                if current is None:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Task not found'}, ensure_ascii=False)}\n\n"
                    return

                if current["status"] in {"completed", "failed", "cancelled"}:
                    detail = await _serialize_scan_task(current)
                    done_payload = {
                        "type": "done",
                        "status": detail["status"],
                        "summary": detail["summary"],
                        "run_id": detail["run_id"],
                        "findings_count": detail["findings_count"],
                        "recommendations_count": detail["recommendations_count"],
                        "error": detail["error"],
                    }
                    yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"
                    return

                await asyncio.sleep(0.5)

        return StreamingResponse(
            _background_event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    from opencmo.web import task_registry

    legacy = task_registry.get_task(task_id)
    if legacy is None:
        return StreamingResponse(
            iter([f"data: {json.dumps({'type': 'error', 'message': 'Task not found'})}\n\n"]),
            media_type="text/event-stream",
            status_code=404,
        )

    async def _event_stream():
        cursor = 0  # how many progress items we already sent

        # Catch-up: replay all existing events
        while cursor < len(legacy.progress):
            event = legacy.progress[cursor]
            yield f"data: {json.dumps({'type': 'progress', **event}, ensure_ascii=False)}\n\n"
            cursor += 1

        # Stream new events until task finishes
        while legacy.status in ("pending", "running"):
            await asyncio.sleep(0.5)

            # Emit any new events that appeared since last check
            while cursor < len(legacy.progress):
                event = legacy.progress[cursor]
                yield f"data: {json.dumps({'type': 'progress', **event}, ensure_ascii=False)}\n\n"
                cursor += 1

        # Drain any remaining events produced after loop exit
        while cursor < len(legacy.progress):
            event = legacy.progress[cursor]
            yield f"data: {json.dumps({'type': 'progress', **event}, ensure_ascii=False)}\n\n"
            cursor += 1

        # Final "done" event with task summary
        done_payload = {
            "type": "done",
            "status": legacy.status,
            "summary": legacy.summary,
            "run_id": legacy.run_id,
            "findings_count": legacy.findings_count,
            "recommendations_count": legacy.recommendations_count,
            "error": legacy.error,
        }
        yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
