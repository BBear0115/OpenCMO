const LOGO_URL = "/logo.png";

/**
 * Convert a logo image URL to a base64 data-URI so it can be
 * embedded reliably in the print window.
 */
async function loadLogoAsDataURI(): Promise<string> {
  try {
    const resp = await fetch(LOGO_URL);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

/**
 * Build a self-contained print stylesheet that produces premium,
 * highly-readable A4 pages via the browser's native print engine.
 */
function buildPrintCSS(): string {
  return `
    @page {
      size: A4;
      margin: 22mm 20mm 22mm 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, 'Microsoft YaHei', sans-serif;
      font-size: 14.5px;
      line-height: 1.85;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ---- Header ---- */
    .report-header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 18px;
      margin-bottom: 32px;
    }
    .report-header img {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: contain;
    }
    .report-header-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      line-height: 1.3;
    }
    .report-header-sub {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 3px;
    }

    /* ---- Content ---- */
    .report-content h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 34px 0 14px;
      padding-bottom: 8px;
      border-bottom: 2.5px solid #6366f1;
      letter-spacing: -0.3px;
      line-height: 1.35;
      page-break-after: avoid;
      break-after: avoid;
    }
    .report-content h1:first-child {
      margin-top: 0;
    }

    .report-content h2 {
      font-size: 19px;
      font-weight: 700;
      color: #1e293b;
      margin: 28px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      line-height: 1.35;
      page-break-after: avoid;
      break-after: avoid;
    }

    .report-content h3 {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin: 22px 0 8px;
      line-height: 1.4;
      page-break-after: avoid;
      break-after: avoid;
    }

    .report-content h4 {
      font-size: 14.5px;
      font-weight: 700;
      color: #475569;
      margin: 18px 0 6px;
      page-break-after: avoid;
      break-after: avoid;
    }

    .report-content p {
      margin: 0 0 13px;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    .report-content ul, .report-content ol {
      margin: 6px 0 14px;
      padding-left: 22px;
    }
    .report-content li {
      margin-bottom: 6px;
      line-height: 1.7;
    }

    .report-content blockquote {
      margin: 14px 0;
      padding: 10px 16px;
      border-left: 4px solid #6366f1;
      background: #f8fafc;
      border-radius: 0 6px 6px 0;
      color: #334155;
    }
    .report-content blockquote p {
      margin-bottom: 4px;
    }

    .report-content strong {
      font-weight: 700;
      color: #0f172a;
    }

    .report-content code {
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
      font-size: 12.5px;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 3px;
      color: #6366f1;
    }

    .report-content pre {
      background: #1e293b;
      color: #e2e8f0;
      padding: 14px;
      border-radius: 8px;
      overflow: auto;
      margin: 10px 0 16px;
      font-size: 12.5px;
      line-height: 1.55;
      page-break-inside: avoid;
    }
    .report-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    .report-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
      page-break-inside: avoid;
    }
    .report-content th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #cbd5e1;
      color: #334155;
    }
    .report-content td {
      padding: 7px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #475569;
    }

    .report-content hr {
      border: none;
      border-top: 1.5px solid #e2e8f0;
      margin: 24px 0;
    }

    /* ---- Footer ---- */
    .report-footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 36px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
  `;
}

/**
 * Open a new print-optimised window with the report content and
 * trigger the browser's native Print dialog (Save as PDF).
 *
 * This approach uses the browser's built-in rendering and pagination
 * engine instead of html2canvas, so it handles long documents without
 * freezing or running out of memory.
 */
export async function downloadAsPDF({
  elementId,
  filename: _filename = "report.pdf",
  title = "AI CMO Report",
  subtitle,
}: {
  elementId: string;
  filename?: string;
  title?: string;
  subtitle?: string;
}) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[pdf] Element #${elementId} not found.`);
    return;
  }

  const logoDataURI = await loadLogoAsDataURI();
  const dateStr = new Date().toLocaleDateString("zh-CN");

  const logoHTML = logoDataURI
    ? `<img src="${logoDataURI}" alt="logo" />`
    : "";

  const subtitleHTML = subtitle
    ? `<div class="report-header-sub">${subtitle}</div>`
    : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${buildPrintCSS()}</style>
</head>
<body>
  <div class="report-header">
    ${logoHTML}
    <div>
      <div class="report-header-title">${title}</div>
      ${subtitleHTML}
      <div class="report-header-sub">Generated by OpenCMO · ${dateStr}</div>
    </div>
  </div>

  <div class="report-content">
    ${element.innerHTML}
  </div>

  <div class="report-footer">
    <span>OpenCMO — AI-Powered Marketing Intelligence</span>
    <span>${new Date().toISOString().slice(0, 10)}</span>
  </div>
</body>
</html>`;

  // Open a new window, write the styled HTML, and trigger print
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the PDF.");
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for fonts and images to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Fallback: if onload doesn't fire (some browsers), trigger after a delay
  setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.print();
    }
  }, 1500);
}
