from playwright.sync_api import sync_playwright
import time
import os

os.makedirs('assets/screenshots', exist_ok=True)

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # A modern dark theme resolution
    context = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark", device_scale_factor=2)
    page = context.new_page()

    BASE_URL = "http://localhost:8080/app"

    print("Capturing Multi-Agent Discussion...")
    try:
        page.goto(f"{BASE_URL}/monitors", wait_until="networkidle")
        
        # Enter a URL
        print("Typing URL...")
        page.fill('input[type="url"]', 'https://openai.com')
        
        # Click Start Monitoring
        print("Clicking submit...")
        page.click('button[type="submit"]')
        
        # Wait for the modal / analysis-scroll to appear
        print("Waiting for discussion to start...")
        page.wait_for_selector('#analysis-scroll', timeout=15000)
        
        # Wait a bit longer to let agents talk
        print("Collecting agent messages... Waiting 15 seconds.")
        time.sleep(15)
        
        page.screenshot(path="assets/screenshots/multi-agent-discussion.png")
        print("Saved multi-agent-discussion.png")
        
    except Exception as e:
        print(f"Error capturing discussion: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
