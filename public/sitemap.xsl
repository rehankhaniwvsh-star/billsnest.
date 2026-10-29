<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap — Invobill</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          :root {
            --bg: #090d16;
            --card-bg: #111827;
            --border: #1f2937;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --accent: #f97316;
            --accent-hover: #ea580c;
            --table-header: #1e293b;
            --row-hover: #1e293b;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            padding: 2.5rem 1rem;
            line-height: 1.5;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 1rem;
            padding: 1.75rem 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          .badge {
            display: inline-block;
            background: rgba(249, 115, 22, 0.15);
            color: var(--accent);
            border: 1px solid rgba(249, 115, 22, 0.3);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 0.5rem;
          }
          p.desc {
            color: var(--text-muted);
            font-size: 0.925rem;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1.25rem;
            padding-top: 1.25rem;
            border-top: 1px solid var(--border);
          }
          .info-item span.label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .info-item span.val {
            font-size: 0.95rem;
            font-weight: 700;
            color: #ffffff;
          }
          .table-wrap {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
          }
          th {
            background: var(--table-header);
            color: #ffffff;
            font-weight: 700;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border);
            color: var(--text-muted);
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background: var(--row-hover);
          }
          td.url-cell {
            color: #ffffff;
            font-weight: 600;
            word-break: break-all;
          }
          td.url-cell a {
            color: #38bdf8;
            text-decoration: none;
          }
          td.url-cell a:hover {
            text-decoration: underline;
            color: #7dd3fc;
          }
          .priority-pill {
            background: rgba(34, 197, 94, 0.15);
            color: #4ade80;
            padding: 0.2rem 0.5rem;
            border-radius: 0.375rem;
            font-weight: 700;
            font-size: 0.75rem;
            display: inline-block;
          }
          .footer {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-muted);
          }
          .footer a {
            color: var(--accent);
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-card">
            <span class="badge">Google Search Console XML Sitemap</span>
            <h1>XML Sitemap Index</h1>
            <p class="desc">
              This is a standard XML Sitemap generated for Googlebot, Bingbot, and web crawlers to discover and index all official pages.
            </p>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Total Indexed URLs</span>
                <span class="val"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> Page(s)</span>
              </div>
              <div class="info-item">
                <span class="label">Format Standard</span>
                <span class="val">sitemaps.org 0.9</span>
              </div>
              <div class="info-item">
                <span class="label">Google Status</span>
                <span class="val" style="color: #4ade80;">100% Crawlable</span>
              </div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 55%;">Page Location (URL)</th>
                  <th style="width: 15%;">Last Modified</th>
                  <th style="width: 15%;">Frequency</th>
                  <th style="width: 15%;">Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td class="url-cell">
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:lastmod"/>
                    </td>
                    <td>
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td>
                      <span class="priority-pill">
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated automatically for Invobill • <a href="/">Return to Homepage</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
