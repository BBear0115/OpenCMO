"""Quick Actions API router — one-click content generation from insights."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from opencmo import storage

router = APIRouter(prefix="/api/v1")

_CHANNEL_LABELS: dict[str, dict[str, str]] = {
    "blog": {"en": "Blog", "zh": "博客"},
    "devto": {"en": "Dev.to", "zh": "Dev.to"},
    "email": {"en": "Email", "zh": "邮件"},
    "github": {"en": "GitHub", "zh": "GitHub"},
    "github_email": {"en": "GitHub email", "zh": "GitHub 邮件"},
    "github_github_issue": {"en": "GitHub issue", "zh": "GitHub Issue"},
    "github_twitter_dm": {"en": "GitHub Twitter DM", "zh": "GitHub Twitter 私信"},
    "gitcode": {"en": "GitCode", "zh": "GitCode"},
    "hackernews": {"en": "Hacker News", "zh": "Hacker News"},
    "infoq": {"en": "InfoQ", "zh": "InfoQ"},
    "jike": {"en": "Jike", "zh": "即刻"},
    "juejin": {"en": "Juejin", "zh": "掘金"},
    "linkedin": {"en": "LinkedIn", "zh": "LinkedIn"},
    "oschina": {"en": "OSCHINA", "zh": "开源中国"},
    "producthunt": {"en": "Product Hunt", "zh": "Product Hunt"},
    "reddit": {"en": "Reddit", "zh": "Reddit"},
    "ruanyifeng": {"en": "Ruan Yifeng Weekly", "zh": "阮一峰周刊"},
    "sspai": {"en": "sspai", "zh": "少数派"},
    "twitter": {"en": "X/Twitter", "zh": "X/Twitter"},
    "v2ex": {"en": "V2EX", "zh": "V2EX"},
    "wechat": {"en": "WeChat", "zh": "微信"},
    "xiaohongshu": {"en": "Xiaohongshu", "zh": "小红书"},
    "zhihu": {"en": "Zhihu", "zh": "知乎"},
}

_APPROVAL_TYPE_LABELS: dict[str, dict[str, str]] = {
    "blog_post": {"en": "Blog post", "zh": "博客文章"},
    "content_update": {"en": "Content update", "zh": "内容更新"},
    "github_outreach_email": {"en": "GitHub outreach email", "zh": "GitHub 外联邮件"},
    "github_outreach_github_issue": {"en": "GitHub outreach issue", "zh": "GitHub 外联 Issue"},
    "github_outreach_twitter_dm": {"en": "GitHub outreach Twitter DM", "zh": "GitHub Twitter 私信外联"},
    "reddit_comment": {"en": "Reddit comment", "zh": "Reddit 评论"},
    "reddit_post": {"en": "Reddit post", "zh": "Reddit 帖子"},
    "reddit_reply": {"en": "Reddit reply", "zh": "Reddit 回复"},
    "twitter_post": {"en": "X/Twitter post", "zh": "X/Twitter 帖子"},
}


def _localized_label(value: str, lang: str, labels: dict[str, dict[str, str]]) -> str:
    normalized = (value or "?").strip() or "?"
    locale = "zh" if lang == "zh" else "en"
    label = labels.get(normalized, {}).get(locale)
    if label:
        return label
    fallback = normalized.replace("_", " ")
    return fallback if locale == "zh" else fallback.title()


def _approval_summary(channel: str, approval_type: str, lang: str) -> str:
    channel_label = _localized_label(channel, lang, _CHANNEL_LABELS)
    approval_type_label = _localized_label(approval_type, lang, _APPROVAL_TYPE_LABELS)
    if lang == "zh":
        return f"{channel_label} · {approval_type_label} 已准备好复核"
    return f"{channel_label} · {approval_type_label} — ready for review"


@router.get("/projects/{project_id}/action-feed")
async def api_v1_action_feed(project_id: int, request: Request):
    """Return a prioritized feed of actionable items for this project.

    Combines: unread insights + pending approvals + latest findings.
    Each item has a CTA type so the frontend knows what button to render.
    """
    project = await storage.get_project(project_id)
    if not project:
        return JSONResponse({"error": "Not found"}, status_code=404)

    lang = request.query_params.get("lang", "en")
    feed: list[dict] = []

    # 1. Unread insights → "view_data" or "generate_content" CTA
    insights = await storage.list_insights(project_id=project_id, unread_only=True)
    from opencmo.web.routers.insights import _translate_insights
    insights = await _translate_insights(insights[:5], lang)

    for ins in insights:
        action_params = ins.get("action_params")
        if isinstance(action_params, str):
            import json
            try:
                action_params = json.loads(action_params)
            except Exception:
                action_params = {}
        cta = "generate_content" if ins.get("action_type") == "api_call" else "view_data"
        feed.append({
            "type": "insight",
            "id": ins["id"],
            "severity": ins.get("severity", "info"),
            "title": ins.get("title", ""),
            "summary": ins.get("summary", ""),
            "cta": cta,
            "action_route": action_params.get("route") if isinstance(action_params, dict) else None,
            "insight_id": ins["id"],
            "created_at": ins.get("created_at", ""),
        })

    # 2. Pending autopilot approvals → "review_approval" CTA
    all_approvals = await storage.list_approvals(status="pending", limit=20)
    project_approvals = [a for a in all_approvals if a.get("project_id") == project_id]
    for appr in project_approvals[:3]:
        channel = str(appr.get("channel", "?"))
        approval_type = str(appr.get("approval_type", "?"))
        feed.append({
            "type": "approval",
            "id": appr["id"],
            "severity": "warning",
            "title": appr.get("title") or ("待复核内容" if lang == "zh" else "Pending approval"),
            "summary": _approval_summary(channel, approval_type, lang),
            "cta": "review_approval",
            "approval_id": appr["id"],
            "created_at": appr.get("created_at", ""),
        })

    # 3. Recent findings → "view_data" CTA
    try:
        findings = await storage.get_task_findings_by_project(project_id, limit=3)
    except Exception:
        findings = []
    for f in findings:
        feed.append({
            "type": "finding",
            "id": f.get("id", 0),
            "severity": f.get("severity", "info"),
            "title": f.get("title", ""),
            "summary": f.get("summary", ""),
            "cta": "view_data",
            "created_at": f.get("created_at", ""),
        })

    # Sort by severity priority
    sev_order = {"critical": 0, "warning": 1, "info": 2}
    feed.sort(key=lambda x: sev_order.get(x.get("severity", "info"), 99))

    return JSONResponse(feed[:8])


@router.post("/projects/{project_id}/quick-generate")
async def api_v1_quick_generate(project_id: int, request: Request):
    """One-click: generate content from an insight and push to approval queue."""
    body = await request.json()
    insight_id = body.get("insight_id")
    if not insight_id:
        return JSONResponse({"error": "insight_id is required"}, status_code=400)

    project = await storage.get_project(project_id)
    if not project:
        return JSONResponse({"error": "Project not found"}, status_code=404)

    from opencmo.autopilot import execute_autopilot

    # Force-execute autopilot for this project (it already filters for actionable insights)
    results = await execute_autopilot(project_id)

    return JSONResponse({
        "ok": True,
        "generated": len(results),
        "approvals": results,
    })
