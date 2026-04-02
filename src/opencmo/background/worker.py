"""In-process worker for unified background tasks."""

from __future__ import annotations

import asyncio
import contextlib
from collections.abc import Awaitable, Callable

from opencmo.background import service as bg_service
from opencmo.background.types import make_worker_id

Executor = Callable[["ExecutorContext"], Awaitable[None]]


class ExecutorContext:
    def __init__(self, task: dict):
        self.task = task

    async def emit(
        self,
        *,
        event_type: str = "progress",
        phase: str = "",
        status: str = "",
        summary: str = "",
        payload: dict | None = None,
    ) -> None:
        await bg_service.append_event(
            self.task["task_id"],
            event_type=event_type,
            phase=phase,
            status=status,
            summary=summary,
            payload=payload or {},
        )

    async def complete(self, result: dict) -> None:
        await bg_service.complete_task(self.task["task_id"], result=result)

    async def fail(self, error: dict) -> None:
        await bg_service.fail_task(self.task["task_id"], error=error)


class BackgroundWorker:
    def __init__(self, *, poll_interval: float = 0.5, stale_after_seconds: int = 90):
        self.poll_interval = poll_interval
        self.stale_after_seconds = stale_after_seconds
        self.worker_id = make_worker_id()
        self._loop_task: asyncio.Task | None = None
        self._stop = asyncio.Event()
        self._executors: dict[str, Executor] = {}
        self._running_tasks: set[asyncio.Task] = set()

    def register_executor(self, kind: str, executor: Executor) -> None:
        self._executors[kind] = executor

    async def start(self) -> None:
        if self._loop_task is not None:
            return
        self._stop.clear()
        self._loop_task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        if self._loop_task is None:
            return
        self._stop.set()
        await self._loop_task
        self._loop_task = None
        if self._running_tasks:
            await asyncio.gather(*self._running_tasks, return_exceptions=True)

    async def _run_loop(self) -> None:
        while not self._stop.is_set():
            await bg_service.recover_stale_tasks(stale_after_seconds=self.stale_after_seconds)
            task = await bg_service.claim_next_task(worker_id=self.worker_id)
            if task is None:
                await asyncio.sleep(self.poll_interval)
                continue

            execution = asyncio.create_task(self._run_claimed_task(task))
            self._running_tasks.add(execution)
            execution.add_done_callback(self._running_tasks.discard)

    async def _run_claimed_task(self, task: dict) -> None:
        heartbeat_task = asyncio.create_task(self._heartbeat_loop(task["task_id"]))
        try:
            executor = self._executors[task["kind"]]
            await bg_service.mark_task_running(task["task_id"], worker_id=self.worker_id)
            fresh = await bg_service.get_task(task["task_id"])
            await executor(ExecutorContext(fresh))
        except Exception as exc:
            await bg_service.fail_task(task["task_id"], error={"message": str(exc)})
        finally:
            heartbeat_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await heartbeat_task

    async def _heartbeat_loop(self, task_id: str) -> None:
        while True:
            await asyncio.sleep(5)
            await bg_service.heartbeat(task_id, worker_id=self.worker_id)


_default_worker: BackgroundWorker | None = None


def get_background_worker() -> BackgroundWorker:
    global _default_worker
    if _default_worker is None:
        _default_worker = BackgroundWorker()
    return _default_worker
