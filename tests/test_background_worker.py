from __future__ import annotations

import asyncio

import pytest

from opencmo.background import service as bg_service
from opencmo.background.worker import BackgroundWorker


@pytest.mark.asyncio
async def test_worker_claims_and_completes_executor_task(tmp_path, monkeypatch):
    from opencmo import storage

    db_path = tmp_path / "test.db"
    monkeypatch.setattr(storage, "_DB_PATH", db_path, raising=False)
    await storage.ensure_db()
    project_id = await storage.ensure_project("Worker", "https://worker.test", "saas")

    task = await bg_service.enqueue_task(
        kind="scan",
        project_id=project_id,
        payload={"project_id": project_id},
        dedupe_key=f"scan:monitor:{project_id}",
    )

    async def _executor(ctx):
        await ctx.complete({"ok": True})

    worker = BackgroundWorker(poll_interval=0.01, stale_after_seconds=60)
    worker.register_executor("scan", _executor)

    await worker.start()
    await asyncio.sleep(0.05)
    await worker.stop()

    updated = await bg_service.get_task(task["task_id"])
    assert updated["status"] == "completed"
    assert updated["result"]["ok"] is True
