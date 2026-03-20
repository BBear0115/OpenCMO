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

    print("Capturing Dashboard...")
    try:
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="assets/screenshots/dashboard-full.png")
    except Exception as e:
        print(f"Error capturing dashboard: {e}")

    print("Capturing Chat Interface...")
    try:
        page.goto(f"{BASE_URL}/chat", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="assets/screenshots/chat-interface.png")
    except Exception as e:
        print(f"Error capturing chat: {e}")

    print("Capturing Monitors...")
    try:
        page.goto(f"{BASE_URL}/monitors", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="assets/screenshots/monitors-panel.png")
    except Exception as e:
        print(f"Error capturing monitors: {e}")

    print("Capturing Settings...")
    try:
        page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path="assets/screenshots/settings-panel.png")
    except Exception as e:
        print(f"Error capturing settings: {e}")

    # Fallback: if routing is hash-based
    print("Capturing hash-based Dashboard...")
    try:
        page.goto(f"{BASE_URL}#/", wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path="assets/screenshots/dashboard-hash.png")
    except Exception as e:
        pass

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
