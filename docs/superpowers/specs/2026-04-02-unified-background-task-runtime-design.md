# Unified Background Task Runtime Design

## Goal

Unify OpenCMO's long-running background work under one persistent runtime model so that scan tasks, report generation, and graph expansion share the same lifecycle, storage, event stream, and recovery semantics.

This design targets productization. The current system mixes:

- in-memory scan task state in `src/opencmo/web/task_registry.py`
- database-backed report task rows plus in-memory active task tracking in `src/opencmo/web/routers/report.py`
- in-memory graph expansion task and progress state in `src/opencmo/web/app.py` and `src/opencmo/web/routers/graph.py`

The result is inconsistent restart behavior, weak multi-worker safety, and fragmented frontend task consumption.

## Scope

This design unifies the runtime model for:

- monitor scan tasks
- report generation tasks
- graph expansion tasks

This design explicitly does **not** migrate chat SSE into the unified task runtime. Chat remains request-scoped streaming for now.

## Non-Goals

- introducing Redis, Celery, or an external queue in this iteration
- moving task execution into a separate deployed worker service in this iteration
- changing report storage, graph domain storage, or scan result storage into task storage
- redesigning the frontend task UX beyond consuming the unified task APIs

## Current Problems

### Split task truth

- Scan jobs exist only in process memory.
- Report jobs partially exist in SQLite and partially in memory.
- Graph expansion uses domain state plus in-memory task/progress tracking.

No single system can answer:

- what tasks are running
- which worker owns them
- whether a task can be resumed
- what events happened so far

### Restart and recovery gaps

- A web process restart loses in-memory scan and expansion task state.
- Report tasks persist rows but still depend on in-memory active tracking for some behavior.
- Recovery semantics differ by task type.

### Multi-worker ambiguity

- Existing task systems assume a single process owns task execution.
- There is no claim protocol, worker identity, heartbeat ownership, or stale task requeue flow.

### Fragmented frontend consumption

- Scan progress comes from `/api/v1/tasks/{task_id}/events` backed by in-memory records.
- Report progress is queried from `/api/v1/reports/tasks/{task_id}` backed by report-specific rows.
- Graph expansion progress is read from `/api/v1/projects/{project_id}/expansion/progress` backed by in-memory lists.

This creates different polling, progress parsing, and error-handling logic for conceptually similar background work.

## Recommended Approach

Introduce a single persistent background task runtime with:

- one generic task table
- one generic task event table
- a task service responsible for lifecycle transitions
- a worker loop responsible for claim, heartbeat, recovery, and execution
- executor modules per task kind

The first implementation still runs workers in-process, but the interfaces must be designed so a separate worker process can reuse the same runtime and executors later.

## Runtime Architecture

### 1. Task API Layer

Responsibilities:

- enqueue background tasks
- query task status
- stream task events
- request cancellation

Rules:

- web routers do not call `asyncio.create_task()` directly for background business jobs
- web routers do not maintain background task ownership maps
- web routers do not own task progress buffers

### 2. Task Runtime Layer

Responsibilities:

- persist task creation
- claim eligible tasks
- transition lifecycle states
- append progress and result events
- update heartbeats
- detect stale tasks and requeue or fail them
- coordinate cancellation state

This is the only layer allowed to mutate generic task runtime state.

### 3. Executor Layer

Responsibilities:

- run business logic for a claimed task
- emit structured progress
- check cancellation requests
- publish light result summaries

Executors do not know table schemas for generic task storage.

### 4. Worker Layer

Responsibilities:

- poll queue
- claim tasks
- run executors
- maintain heartbeat
- recover stale work

The initial worker runs inside the web process at startup. The interface is intentionally shaped so a future dedicated worker process can use the same code.

## Data Model

### Table: `background_tasks`

This becomes the canonical runtime table for all background work.

Proposed fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `task_id TEXT NOT NULL UNIQUE`
- `kind TEXT NOT NULL`
  - `scan`
  - `report`
  - `graph_expansion`
- `project_id INTEGER REFERENCES projects(id)`
- `status TEXT NOT NULL`
  - `queued`
  - `claimed`
  - `running`
  - `cancel_requested`
  - `completed`
  - `failed`
  - `cancelled`
- `payload_json TEXT NOT NULL DEFAULT '{}'`
- `result_json TEXT NOT NULL DEFAULT '{}'`
- `error_json TEXT NOT NULL DEFAULT '{}'`
- `dedupe_key TEXT`
- `priority INTEGER NOT NULL DEFAULT 50`
- `run_after TEXT`
- `attempt_count INTEGER NOT NULL DEFAULT 0`
- `max_attempts INTEGER NOT NULL DEFAULT 3`
- `worker_id TEXT`
- `claimed_at TEXT`
- `heartbeat_at TEXT`
- `started_at TEXT`
- `completed_at TEXT`
- `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
- `updated_at TEXT NOT NULL DEFAULT (datetime('now'))`

Recommended indexes:

- unique index on `task_id`
- normal index on `(status, priority, run_after, created_at)`
- index on `(project_id, created_at DESC)`

Deduplication rule:

- active-task dedupe is enforced in the background task service, not via a partial unique SQLite index
- a new enqueue request with the same `dedupe_key` should return the existing active task when that task is in `queued`, `claimed`, `running`, or `cancel_requested`

### Table: `background_task_events`

This becomes the canonical progress and lifecycle event stream.

Proposed fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `task_id TEXT NOT NULL REFERENCES background_tasks(task_id)`
- `event_type TEXT NOT NULL`
  - `progress`
  - `log`
  - `state_change`
  - `result`
- `phase TEXT NOT NULL DEFAULT ''`
- `status TEXT NOT NULL DEFAULT ''`
- `summary TEXT NOT NULL DEFAULT ''`
- `payload_json TEXT NOT NULL DEFAULT '{}'`
- `created_at TEXT NOT NULL DEFAULT (datetime('now'))`

Recommended indexes:

- index on `(task_id, id)`
- index on `(task_id, created_at)`

## State Machine

### Primary transitions

- `queued -> claimed -> running -> completed`
- `queued -> claimed -> running -> failed`
- `queued -> cancel_requested -> cancelled`
- `running -> cancel_requested -> cancelled`

### Recovery transitions

If a task is stale in `claimed` or `running` because `heartbeat_at` expired:

- if `attempt_count < max_attempts`, transition to `queued`
- otherwise transition to `failed`

### Why keep `claimed` and `running` separate

`claimed` means a worker has taken ownership but execution has not fully started.

`running` means business logic is actively executing and should be emitting progress or heartbeat updates.

This distinction makes stale-claim debugging and worker crash diagnostics much clearer.

## Task Kinds And Payloads

### `scan`

Payload fields:

- `monitor_id`
- `project_id`
- `job_type`
- `job_id`
- `analyze_url`
- `locale`

Dedupe key recommendation:

- `scan:monitor:{monitor_id}`

Result summary recommendation:

- `run_id`
- `summary`
- `findings_count`
- `recommendations_count`

### `report`

Payload fields:

- `project_id`
- `report_kind`

Dedupe key recommendation:

- `report:project:{project_id}:{report_kind}`

Result summary recommendation:

- `project_id`
- `report_kind`
- `latest_human_report_id`
- `latest_agent_report_id`

### `graph_expansion`

Payload fields:

- `project_id`
- `resume` boolean

Dedupe key recommendation:

- `graph:project:{project_id}`

Result summary recommendation:

- `project_id`
- `current_wave`
- `nodes_discovered`
- `nodes_explored`
- `runtime_state`

## Domain Tables That Stay

These remain authoritative for business data, not runtime coordination:

- `scan_runs`
- `reports`
- `graph_expansions`
- `graph_expansion_nodes`
- `graph_expansion_edges`

Important rule:

- domain tables remain the source of domain results
- runtime tables remain the source of background task lifecycle and event history

In particular, `graph_expansions.runtime_state` should become a domain snapshot, not the source of truth for scheduler ownership.

## Module Layout

Create a new package:

- `src/opencmo/background/`

Proposed modules:

- `service.py`
  - enqueue, fetch, cancel, recover, lifecycle transitions
- `storage.py`
  - CRUD for `background_tasks` and `background_task_events`
- `worker.py`
  - polling, claiming, heartbeat, execution loop
- `executors/scan.py`
- `executors/report.py`
- `executors/graph_expansion.py`
- `types.py`
  - task kinds, statuses, typed payload helpers

## Executor Contract

Each executor should receive a small runtime context, not direct storage handles for generic task tables.

Recommended contract:

- `task`
- `payload`
- `event_writer`
- `heartbeat`
- `is_cancel_requested`

Responsibilities:

- call business workflows already present in the codebase
- translate workflow progress into unified task events
- stop cooperatively when cancellation is requested
- return light summary data for `result_json`

## Worker Design

### Initial implementation

- one in-process worker started during app startup
- unique `worker_id` per process
- polling loop over `queued` tasks
- claim through transactional state update
- spawn execution coroutine per claimed task
- heartbeat loop per running task

### Future-compatible design

The worker must not depend on FastAPI request state or in-memory router globals. That allows:

- separate worker process later
- more than one worker process later
- isolated task execution tests

## API Design

### Unified endpoints

Standardize around:

- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{task_id}`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks/{task_id}/cancel`
- `GET /api/v1/tasks/{task_id}/events`

### Compatibility wrappers

Existing routes should remain but delegate into the unified task system:

- monitor creation auto-run and monitor manual run enqueue `scan`
- report regenerate enqueues `report`
- graph expansion start enqueues `graph_expansion`

Compatibility endpoints that may remain temporarily:

- `/api/v1/reports/tasks/{task_id}`
- `/api/v1/projects/{project_id}/expansion/progress`

But their internal truth source should become the unified task runtime.

## Event Stream Semantics

All background tasks should emit events from the same table and stream through the same SSE endpoint.

Required behavior:

1. replay existing events first
2. continue streaming new events
3. emit a terminal event on completion

Terminal event statuses:

- `completed`
- `failed`
- `cancelled`

This removes special-case frontend logic for scan versus report versus graph expansion progress retrieval.

## Migration Plan

### Phase 1: Add new runtime storage

- add `background_tasks`
- add `background_task_events`
- add storage helpers and service lifecycle methods

### Phase 2: Build worker and executors

- implement queue polling
- implement claim and heartbeat
- implement stale recovery
- implement scan executor
- implement report executor
- implement graph expansion executor

### Phase 3: Move API producers

- migrate monitor-triggered scans to unified enqueue
- migrate report regeneration to unified enqueue
- migrate graph expansion start to unified enqueue

### Phase 4: Move API consumers

- move SSE to read unified event table
- move task detail endpoints to unified task table
- make graph expansion progress compatibility endpoint read unified events
- make report task compatibility endpoint read unified task state

### Phase 5: Remove legacy runtime state

- delete `task_registry.py`
- remove `_active_report_tasks`
- remove `_expansion_tasks`
- remove `_expansion_progress`

### Phase 6: Startup recovery

- run stale task recovery during startup
- start in-process worker at startup

## Risks And Mitigations

### Risk: duplicate execution under multi-process startup

Mitigation:

- claim only through atomic status transition
- require worker ownership fields
- heartbeat-based stale recovery only after timeout

### Risk: breaking existing frontend task progress flows

Mitigation:

- preserve existing endpoints as compatibility shims during migration
- keep event payload shape close to current scan/report progress events

### Risk: graph expansion cancellation or pause semantics regress

Mitigation:

- keep `desired_state` domain behavior in graph expansion
- task cancellation requests and graph pause requests must cooperate rather than replace each other blindly

### Risk: scope blow-up

Mitigation:

- do not pull chat streaming into this refactor
- do not introduce external queue infrastructure in this iteration
- keep domain result tables unchanged

## Testing Strategy

### Unit tests

- storage CRUD for background tasks and events
- claim logic under contention
- stale recovery transitions
- cancellation transitions
- dedupe behavior

### Integration tests

- enqueue scan task, run worker, observe terminal task state
- enqueue report task, observe progress and result summary
- enqueue graph expansion task, observe progress and domain side effects
- restart recovery path for stale tasks

### API tests

- monitor auto-run returns unified task id
- report regenerate returns unified task id
- graph expansion start returns unified task id
- SSE endpoint replays history and streams terminal event

## Acceptance Criteria

- all scan, report, and graph expansion background jobs are represented in `background_tasks`
- all task progress is persisted in `background_task_events`
- no router owns background execution via `asyncio.create_task()` for these task kinds
- restart recovery works via claim and heartbeat semantics
- frontend can read one consistent task status model
- legacy runtime globals for scan/report/graph background jobs are removed

## Open Decisions Resolved

- chat is excluded from this task runtime refactor
- initial execution stays in-process
- the design is intentionally ready for a future separate worker process
