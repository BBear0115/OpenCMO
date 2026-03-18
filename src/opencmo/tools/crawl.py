from agents import function_tool
from crawl4ai import AsyncWebCrawler


@function_tool
async def crawl_website(url: str) -> str:
    """Crawl a website and return its content as markdown.

    Args:
        url: The URL of the website to crawl.
    """
    try:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url)
            content = result.markdown or ""
            if len(content) > 10000:
                content = content[:10000] + "\n\n... [content truncated at 10000 characters]"
            return content
    except Exception as e:
        return f"Failed to crawl {url}: {e}"
