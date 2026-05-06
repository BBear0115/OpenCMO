from __future__ import annotations

import pytest
from fastapi.responses import FileResponse, JSONResponse

from opencmo.report_charts import build_report_charts, get_report_asset_path
from opencmo.reports import (
    _normalize_report_headings,
    _postprocess_human_report_content,
    _simple_markdown_to_html,
)
from opencmo.web.routers.report import api_v1_report_asset


def test_strategic_chart_builder_uses_real_fact_values(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENCMO_REPORT_ASSET_DIR", str(tmp_path))
    facts = {
        "latest_scans": {
            "seo": {"score": 0.82},
            "geo": {"score": 57},
            "community": {"total_hits": 12},
        },
        "citability": [{"avg_score": 0.41}],
        "brand_presence": [{"footprint_score": 33}],
        "serp_latest": [{"keyword": "ai cmo", "position": 4}],
        "findings": [{"severity": "high"}],
        "recommendations": [{"priority": "medium"}],
    }
    charts = build_report_charts("strategic", facts, {"sample_count": 3, "total_data_sources": 5})

    assert charts
    assert charts[0].markdown.startswith("![")
    svg = get_report_asset_path(charts[0].asset_id).read_text(encoding="utf-8")
    assert "SEO" in svg
    assert "82" in svg
    assert "57" in svg


def test_periodic_chart_builder_requires_two_points_for_trends(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENCMO_REPORT_ASSET_DIR", str(tmp_path))
    facts = {
        "seo_history": [{"scanned_at": "2026-05-01T00:00:00", "score_performance": 0.7}],
        "geo_history": [
            {"scanned_at": "2026-05-01T00:00:00", "geo_score": 40},
            {"scanned_at": "2026-05-02T00:00:00", "geo_score": 50},
        ],
        "community_history": [],
        "citability": [],
        "findings": [],
        "recommendations": [],
    }
    charts = build_report_charts("periodic", facts, {"sample_count": 2, "total_data_sources": 8})

    assert [chart.title for chart in charts] == ["GEO 趋势"]
    svg = get_report_asset_path(charts[0].asset_id).read_text(encoding="utf-8")
    assert "40" in svg
    assert "50" in svg


def test_report_heading_normalization_and_chart_section_insertion():
    content = "# 总标题\n\n## 1. 执行摘要\n\n正文\n\n#### 深层标题\n\n内容"

    normalized = _normalize_report_headings(content)
    assert "####" not in normalized
    assert "### 深层标题" in normalized

    processed = _postprocess_human_report_content(normalized, "### 图表\n![图](/api/v1/report-assets/abc.svg)")
    assert "## 2. 数据图表速览" in processed
    assert processed.count("# 总标题") == 1


def test_simple_markdown_to_html_supports_images():
    html = _simple_markdown_to_html("![关键指标](/api/v1/report-assets/abc.svg)")

    assert '<img src="/api/v1/report-assets/abc.svg" alt="关键指标" />' in html
    assert "<figcaption>关键指标</figcaption>" in html


@pytest.mark.asyncio
async def test_report_asset_route_serves_svg(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENCMO_REPORT_ASSET_DIR", str(tmp_path))
    asset_id = "a" * 32
    (tmp_path / f"{asset_id}.svg").write_text("<svg></svg>", encoding="utf-8")

    response = await api_v1_report_asset(asset_id)

    assert isinstance(response, FileResponse)
    assert response.media_type == "image/svg+xml"


@pytest.mark.asyncio
async def test_report_asset_route_rejects_missing_or_invalid_assets(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENCMO_REPORT_ASSET_DIR", str(tmp_path))

    response = await api_v1_report_asset("../bad")

    assert isinstance(response, JSONResponse)
    assert response.status_code == 404
